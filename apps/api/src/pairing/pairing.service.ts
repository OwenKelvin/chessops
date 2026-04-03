import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WebhookService } from '../webhook/webhook.service';
import { WebhookEvents } from '../webhook/webhook.events';

export interface PairingResult {
  id: string;
  roundId: string;
  pairings: Array<{
    whiteId: string;
    blackId: string;
    boardNumber: number;
  }>;
  bye?: {
    playerId: string;
    roundNumber: number;
  };
}

@Injectable()
export class PairingService {
  constructor(
    private prisma: PrismaService,
    private webhookService: WebhookService,
  ) {}

  /**
   * Generate Swiss system pairings for a round
   * Players are paired based on score, with rating as tiebreaker
   */
  async generateSwissPairings(tournamentId: string, roundNumber: number): Promise<PairingResult> {
    // Get tournament info
    const tournament = await this.prisma.tournament.findUnique({
      where: { id: tournamentId },
    });

    if (!tournament) {
      throw new NotFoundException('Tournament not found');
    }

    if (tournament.format !== 'swiss') {
      throw new BadRequestException('Tournament is not using Swiss format');
    }

    // Get or create round
    let round = await this.prisma.round.findFirst({
      where: { tournamentId, roundNumber },
    });

    if (!round) {
      round = await this.prisma.round.create({
        data: {
          tournamentId,
          roundNumber,
          name: `Round ${roundNumber}`,
          status: 'pending',
        },
      });
    }

    // Check if pairings already exist
    const existingPairings = await this.prisma.pairing.findMany({
      where: { roundId: round.id },
    });

    if (existingPairings.length > 0) {
      throw new BadRequestException('Pairings already exist for this round');
    }

    // Get active players with their scores and previous opponents
    const tournamentPlayers = await this.prisma.tournamentPlayer.findMany({
      where: {
        tournamentId,
        status: 'active',
      },
      include: {
        player: true,
        results: {
          select: {
            opponentId: true,
            result: true,
            color: true,
          },
        },
      },
      orderBy: [
        { seed: 'asc' },
      ],
    });

    if (tournamentPlayers.length === 0) {
      throw new BadRequestException('No active players in tournament');
    }

    // Calculate scores for each player
    const playerScores = tournamentPlayers.map((tp) => ({
      playerId: tp.playerId,
      seed: tp.seed,
      rating: tp.rating || tp.player.rating || 0,
      score: tp.results.reduce((sum, r) => sum + parseFloat(r.result), 0),
      opponents: tp.results.map((r) => r.opponentId),
      colors: tp.results.map((r) => r.color),
    }));

    // Sort by score (desc), then rating (desc), then seed (asc)
    playerScores.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (b.rating !== a.rating) return b.rating - a.rating;
      return a.seed - b.seed;
    });

    // Handle odd number of players - one gets a bye
    let byePlayerId: string | undefined;
    const playersToPair = [...playerScores];

    if (playersToPair.length % 2 !== 0) {
      // Find the lowest-ranked player who hasn't had a bye yet
      // For simplicity, give bye to last player
      byePlayerId = playersToPair.pop()!.playerId;
    }

    // Generate pairings using greedy algorithm
    const pairings: Array<{ whiteId: string; blackId: string; boardNumber: number }> = [];
    const paired = new Set<string>();
    let boardNumber = 1;

    for (let i = 0; i < playersToPair.length; i++) {
      if (paired.has(playersToPair[i].playerId)) continue;

      const player1 = playersToPair[i];
      let opponent: typeof player1 | undefined;

      // Try to find opponent with same score
      for (let j = i + 1; j < playersToPair.length; j++) {
        const player2 = playersToPair[j];
        if (paired.has(player2.playerId)) continue;

        // Check if they've already played
        if (player1.opponents.includes(player2.playerId)) continue;

        // Check color balance (try to avoid 3+ same color in a row)
        const player1BlackCount = player1.colors.filter((c) => c === 'B').length;
        const player1WhiteCount = player1.colors.filter((c) => c === 'W').length;
        const player2BlackCount = player2.colors.filter((c) => c === 'B').length;
        const player2WhiteCount = player2.colors.filter((c) => c === 'W').length;

        // Assign colors based on balance and previous games
        opponent = player2;
        break;
      }

      if (!opponent) {
        // Fallback: pair with next available player (may have played before)
        for (let j = i + 1; j < playersToPair.length; j++) {
          if (!paired.has(playersToPair[j].playerId)) {
            opponent = playersToPair[j];
            break;
          }
        }
      }

      if (opponent) {
        // Determine colors: higher score/rating gets white preference
        const player1ShouldBeWhite =
          player1.score > opponent.score ||
          (player1.score === opponent.score &&
            (player1.rating > opponent.rating ||
              (player1.rating === opponent.rating && player1.seed < opponent.seed)));

        // Adjust for color balance
        const player1BlackStreak = this.countConsecutiveColors(player1.colors, 'B');
        const player1WhiteStreak = this.countConsecutiveColors(player1.colors, 'W');
        const opponentBlackStreak = this.countConsecutiveColors(opponent.colors, 'B');
        const opponentWhiteStreak = this.countConsecutiveColors(opponent.colors, 'W');

        let whiteId: string;
        let blackId: string;

        if (player1BlackStreak >= 2 && player1WhiteStreak < 2) {
          whiteId = player1.playerId;
          blackId = opponent.playerId;
        } else if (opponentWhiteStreak >= 2 && opponentBlackStreak < 2) {
          whiteId = opponent.playerId;
          blackId = player1.playerId;
        } else if (player1ShouldBeWhite) {
          whiteId = player1.playerId;
          blackId = opponent.playerId;
        } else {
          whiteId = opponent.playerId;
          blackId = player1.playerId;
        }

        pairings.push({
          whiteId,
          blackId,
          boardNumber: boardNumber++,
        });

        paired.add(player1.playerId);
        paired.add(opponent.playerId);
      }
    }

    // Create pairings in database
    const createdPairings = [];
    for (const pairing of pairings) {
      const created = await this.prisma.pairing.create({
        data: {
          roundId: round.id,
          whiteId: pairing.whiteId,
          blackId: pairing.blackId,
          boardNumber: pairing.boardNumber,
          status: 'pending',
        },
        include: {
          white: true,
          black: true,
        },
      });
      createdPairings.push(created);
    }

    // Publish webhook event
    await this.webhookService.publish(WebhookEvents.PAIRINGS_GENERATED, {
      tournamentId,
      roundId: round.id,
      roundNumber,
      pairingsCount: createdPairings.length,
    });

    return {
      id: round.id,
      roundId: round.id,
      pairings,
      bye: byePlayerId ? { playerId: byePlayerId, roundNumber } : undefined,
    };
  }

  /**
   * Generate Round-Robin pairings for all rounds
   * Each player plays every other player exactly once
   */
  async generateRoundRobinPairings(tournamentId: string): Promise<{
    rounds: Array<{
      roundNumber: number;
      pairings: Array<{ whiteId: string; blackId: string; boardNumber: number }>;
      bye?: { playerId: string };
    }>;
  }> {
    const tournament = await this.prisma.tournament.findUnique({
      where: { id: tournamentId },
    });

    if (!tournament) {
      throw new NotFoundException('Tournament not found');
    }

    if (tournament.format !== 'roundrobin') {
      throw new BadRequestException('Tournament is not using Round-Robin format');
    }

    // Get active players
    const tournamentPlayers = await this.prisma.tournamentPlayer.findMany({
      where: {
        tournamentId,
        status: 'active',
      },
      include: {
        player: true,
      },
      orderBy: [{ seed: 'asc' }],
    });

    if (tournamentPlayers.length < 2) {
      throw new BadRequestException('Need at least 2 players for Round-Robin');
    }

    const playerIds = tournamentPlayers.map((tp) => tp.playerId);
    const numPlayers = playerIds.length;
    const numRounds = numPlayers - 1;
    const matchesPerRound = Math.floor(numPlayers / 2);

    // Berger tables algorithm for round-robin
    // If odd number of players, one sits out each round (bye)
    const allRounds = [];

    // Create initial arrangement
    const players = [...playerIds];
    if (numPlayers % 2 !== 0) {
      players.push('BYE'); // Dummy player for bye
    }

    for (let round = 1; round <= numRounds; round++) {
      const roundPairings = [];
      let boardNumber = 1;

      // Pair first player with last, second with second-to-last, etc.
      const half = players.length / 2;
      for (let i = 0; i < half; i++) {
        const player1 = players[i];
        const player2 = players[players.length - 1 - i];

        if (player1 === 'BYE' || player2 === 'BYE') {
          // This is the bye round for one player
          continue;
        }

        // Alternate colors: odd rounds - lower index gets white
        const whiteId = round % 2 === 1 ? player1 : player2;
        const blackId = round % 2 === 1 ? player2 : player1;

        roundPairings.push({
          whiteId,
          blackId,
          boardNumber: boardNumber++,
        });
      }

      // Rotate players (keep first fixed, rotate rest)
      const last = players.pop()!;
      players.splice(1, 0, last);

      allRounds.push({
        roundNumber: round,
        pairings: roundPairings,
      });
    }

    // Create all rounds and pairings in database
    for (const roundData of allRounds) {
      const round = await this.prisma.round.create({
        data: {
          tournamentId,
          roundNumber: roundData.roundNumber,
          name: `Round ${roundData.roundNumber}`,
          status: 'pending',
        },
      });

      for (const pairing of roundData.pairings) {
        await this.prisma.pairing.create({
          data: {
            roundId: round.id,
            whiteId: pairing.whiteId,
            blackId: pairing.blackId,
            boardNumber: pairing.boardNumber,
            status: 'pending',
          },
        });
      }
    }

    await this.webhookService.publish(WebhookEvents.PAIRINGS_GENERATED, {
      tournamentId,
      totalRounds: allRounds.length,
      format: 'roundrobin',
    });

    return { rounds: allRounds };
  }

  /**
   * Generate elimination bracket pairings (for knockout tournaments)
   * Assumes players are already seeded
   */
  async generateEliminationPairings(tournamentId: string, roundNumber: number): Promise<PairingResult> {
    const tournament = await this.prisma.tournament.findUnique({
      where: { id: tournamentId },
    });

    if (!tournament) {
      throw new NotFoundException('Tournament not found');
    }

    if (tournament.format !== 'elimination') {
      throw new BadRequestException('Tournament is not using Elimination format');
    }

    // Get or create round
    let round = await this.prisma.round.findFirst({
      where: { tournamentId, roundNumber },
    });

    if (!round) {
      round = await this.prisma.round.create({
        data: {
          tournamentId,
          roundNumber,
          name: this.getEliminationRoundName(roundNumber),
          status: 'pending',
        },
      });
    }

    // For elimination, get winners from previous round (or initial seeds for round 1)
    let playersForRound: { playerId: string; seed: number }[];

    if (roundNumber === 1) {
      // First round - use initial seeds
      const tournamentPlayers = await this.prisma.tournamentPlayer.findMany({
        where: {
          tournamentId,
          status: 'active',
        },
        include: {
          player: true,
        },
        orderBy: [{ seed: 'asc' }],
      });

      playersForRound = tournamentPlayers.map((tp) => ({
        playerId: tp.playerId,
        seed: tp.seed,
      }));
    } else {
      // Get winners from previous round
      const previousRound = await this.prisma.round.findFirst({
        where: { tournamentId, roundNumber: roundNumber - 1 },
        include: {
          pairings: {
            where: { status: 'completed' },
          },
        },
      });

      if (!previousRound) {
        throw new BadRequestException(`Previous round ${roundNumber - 1} not found or not completed`);
      }

      // Get winners
      const winners = previousRound.pairings.map((p) => {
        const whiteScore = p.whiteScore ?? 0;
        const blackScore = p.blackScore ?? 0;
        return whiteScore > blackScore
          ? { playerId: p.whiteId, seed: 0 }
          : { playerId: p.blackId, seed: 0 };
      });

      playersForRound = winners;
    }

    if (playersForRound.length < 2) {
      throw new BadRequestException('Need at least 2 players for elimination round');
    }

    // Pair 1st vs last, 2nd vs second-to-last, etc. (standard bracket)
    const pairings: Array<{ whiteId: string; blackId: string; boardNumber: number }> = [];
    const numMatches = Math.floor(playersForRound.length / 2);

    for (let i = 0; i < numMatches; i++) {
      const player1 = playersForRound[i];
      const player2 = playersForRound[playersForRound.length - 1 - i];

      // Higher seed gets white
      const whiteId = player1.seed <= player2.seed ? player1.playerId : player2.playerId;
      const blackId = player1.seed <= player2.seed ? player2.playerId : player1.playerId;

      pairings.push({
        whiteId,
        blackId,
        boardNumber: i + 1,
      });
    }

    // Create pairings in database
    for (const pairing of pairings) {
      await this.prisma.pairing.create({
        data: {
          roundId: round.id,
          whiteId: pairing.whiteId,
          blackId: pairing.blackId,
          boardNumber: pairing.boardNumber,
          status: 'pending',
        },
      });
    }

    await this.webhookService.publish(WebhookEvents.PAIRINGS_GENERATED, {
      tournamentId,
      roundId: round.id,
      roundNumber,
      pairingsCount: pairings.length,
    });

    return {
      id: round.id,
      roundId: round.id,
      pairings,
    };
  }

  /**
   * Count consecutive occurrences of a color at the end of the color array
   */
  private countConsecutiveColors(colors: string[], color: string): number {
    let count = 0;
    for (let i = colors.length - 1; i >= 0; i--) {
      if (colors[i] === color) count++;
      else break;
    }
    return count;
  }

  /**
   * Get name for elimination round
   */
  private getEliminationRoundName(roundNumber: number): string {
    const roundNames: Record<number, string> = {
      1: 'Round of 64',
      2: 'Round of 32',
      3: 'Round of 16',
      4: 'Quarterfinals',
      5: 'Semifinals',
      6: 'Finals',
    };
    return roundNames[roundNumber] || `Round ${roundNumber}`;
  }
}
