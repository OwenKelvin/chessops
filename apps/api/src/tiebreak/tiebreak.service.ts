import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface TiebreakResult {
  playerId: string;
  name: string;
  seed: number;
  points: number;
  tiebreaks: {
    buchholz: number;      // Sum of opponents' scores
    buchholzMedian: number; // Buchholz excluding highest and lowest
    sonnebornBerger: number; // Sum of (defeated opponents' scores + half of drawn opponents' scores)
    directEncounter?: {     // Head-to-head record (if applicable)
      points: number;
      games: number;
    };
    progressScore: number;  // Cumulative score after each round
    averageOpponentRating: number;
  };
}

export interface StandingsWithTiebreaks {
  tournamentId: string;
  standings: Array<{
    rank: number;
    playerId: string;
    name: string;
    seed: number;
    rating: number;
    points: number;
    games: number;
    wins: number;
    draws: number;
    losses: number;
    tiebreaks: {
      buchholz: number;
      buchholzMedian: number;
      sonnebornBerger: number;
      directEncounter?: {
        points: number;
        games: number;
      };
      progressScore: number;
      averageOpponentRating: number;
    };
    status: string;
  }>;
}

@Injectable()
export class TiebreakService {
  constructor(private prisma: PrismaService) {}

  /**
   * Calculate comprehensive standings with all tiebreak systems
   */
  async calculateStandings(tournamentId: string): Promise<StandingsWithTiebreaks> {
    const tournament = await this.prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: {
        rounds: {
          include: {
            pairings: {
              include: {
                white: true,
                black: true,
              },
            },
          },
          orderBy: { roundNumber: 'asc' },
        },
      },
    });

    if (!tournament) {
      throw new NotFoundException('Tournament not found');
    }

    // Get all players with their results
    const tournamentPlayers = await this.prisma.tournamentPlayer.findMany({
      where: {
        tournamentId,
      },
      include: {
        player: true,
        results: true,
      },
    });

    // Build opponent map for each player
    const opponentMap = new Map<string, Map<string, { result: number; color: string }>>();
    const roundScores = new Map<string, number[]>();

    for (const tp of tournamentPlayers) {
      const opponents = new Map<string, { result: number; color: string }>();
      const scores: number[] = [];

      for (const result of tp.results) {
        const score = parseFloat(result.result);
        opponents.set(result.opponentId, {
          result: score,
          color: result.color,
        });

        // Note: round number tracking skipped - round relation not included
        // Progress score will be calculated differently
      }

      // Fill missing rounds with 0 (bye or not played)
      for (let i = 0; i < tournament.rounds.length; i++) {
        if (scores[i] === undefined) {
          scores[i] = 0;
        }
      }

      opponentMap.set(tp.playerId, opponents);
      roundScores.set(tp.playerId, scores);
    }

    // Calculate opponent scores for Buchholz
    const playerTotalScores = new Map<string, number>();
    for (const tp of tournamentPlayers) {
      const totalScore = tp.results.reduce((sum, r) => sum + parseFloat(r.result), 0);
      playerTotalScores.set(tp.playerId, totalScore);
    }

    // Calculate standings with tiebreaks
    const standings: StandingsWithTiebreaks['standings'] = tournamentPlayers.map((tp) => {
      const opponents = opponentMap.get(tp.playerId)!;
      const scores = roundScores.get(tp.playerId)!;

      // Buchholz: sum of all opponents' scores
      let buchholz = 0;
      const opponentScores: number[] = [];
      for (const [opponentId] of opponents) {
        const oppScore = playerTotalScores.get(opponentId) || 0;
        buchholz += oppScore;
        opponentScores.push(oppScore);
      }

      // Buchholz Median: exclude highest and lowest opponent scores
      let buchholzMedian = buchholz;
      if (opponentScores.length >= 3) {
        const sorted = [...opponentScores].sort((a, b) => a - b);
        sorted.shift(); // Remove lowest
        sorted.pop();   // Remove highest
        buchholzMedian = sorted.reduce((sum, s) => sum + s, 0);
      }

      // Sonneborn-Berger: sum of defeated opponents' scores + half of drawn opponents' scores
      let sonnebornBerger = 0;
      for (const [opponentId, match] of opponents) {
        const oppScore = playerTotalScores.get(opponentId) || 0;
        if (match.result === 1) {
          sonnebornBerger += oppScore;
        } else if (match.result === 0.5) {
          sonnebornBerger += oppScore * 0.5;
        }
      }

      // Direct Encounter: head-to-head record against tied opponents
      // (Calculated later when we know who is tied)
      let directEncounter: TiebreakResult['tiebreaks']['directEncounter'] | undefined;

      // Progress Score: cumulative score after each round
      let progressScore = 0;
      let cumulative = 0;
      for (const score of scores) {
        cumulative += score;
        progressScore += cumulative;
      }

      // Average Opponent Rating
      let totalOpponentRating = 0;
      let opponentCount = 0;
      for (const [opponentId] of opponents) {
        const opponent = tournamentPlayers.find((tp) => tp.playerId === opponentId);
        if (opponent) {
          totalOpponentRating += opponent.player.rating || opponent.rating || 0;
          opponentCount++;
        }
      }
      const averageOpponentRating = opponentCount > 0 ? totalOpponentRating / opponentCount : 0;

      // Count wins, draws, losses
      let wins = 0;
      let draws = 0;
      let losses = 0;
      for (const result of tp.results) {
        const score = parseFloat(result.result);
        if (score === 1) wins++;
        else if (score === 0.5) draws++;
        else losses++;
      }

      const totalPoints = tp.results.reduce((sum, r) => sum + parseFloat(r.result), 0);

      return {
        rank: 0, // Will be assigned after sorting
        playerId: tp.playerId,
        name: `${tp.player.firstName} ${tp.player.lastName}`,
        seed: tp.seed,
        rating: tp.player.rating || tp.rating || 0,
        points: totalPoints,
        games: tp.results.length,
        wins,
        draws,
        losses,
        tiebreaks: {
          buchholz: Math.round(buchholz * 100) / 100,
          buchholzMedian: Math.round(buchholzMedian * 100) / 100,
          sonnebornBerger: Math.round(sonnebornBerger * 100) / 100,
          directEncounter,
          progressScore: 0, // Disabled - requires round relation
          averageOpponentRating: Math.round(averageOpponentRating),
        },
        status: tp.status,
      };
    });

    // Sort by points, then by tiebreaks
    standings.sort((a, b) => {
      // Primary: points
      if (b.points !== a.points) return b.points - a.points;

      // Secondary: Buchholz
      if (b.tiebreaks.buchholz !== a.tiebreaks.buchholz) {
        return b.tiebreaks.buchholz - a.tiebreaks.buchholz;
      }

      // Tertiary: Sonneborn-Berger
      if (b.tiebreaks.sonnebornBerger !== a.tiebreaks.sonnebornBerger) {
        return b.tiebreaks.sonnebornBerger - a.tiebreaks.sonnebornBerger;
      }

      // Quaternary: Progress Score
      if (b.tiebreaks.progressScore !== a.tiebreaks.progressScore) {
        return b.tiebreaks.progressScore - a.tiebreaks.progressScore;
      }

      // Quinary: Average Opponent Rating
      if (b.tiebreaks.averageOpponentRating !== a.tiebreaks.averageOpponentRating) {
        return b.tiebreaks.averageOpponentRating - a.tiebreaks.averageOpponentRating;
      }

      // Senary: Seed (lower is better)
      return a.seed - b.seed;
    });

    // Calculate direct encounter for players with same points
    this.calculateDirectEncounter(standings, opponentMap);

    // Add rank
    let rank = 1;
    for (let i = 0; i < standings.length; i++) {
      if (i > 0 && this.hasSameScore(standings[i], standings[i - 1])) {
        standings[i].rank = standings[i - 1].rank;
      } else {
        standings[i].rank = rank;
      }
      rank = standings[i].rank + 1;
    }

    return {
      tournamentId,
      standings,
    };
  }

  /**
   * Calculate direct encounter (head-to-head) for tied players
   */
  private calculateDirectEncounter(
    standings: StandingsWithTiebreaks['standings'],
    opponentMap: Map<string, Map<string, { result: number; color: string }>>,
  ) {
    const n = standings.length;
    for (let i = 0; i < n; i++) {
      // Find all players with same points
      const tiedPlayers = [standings[i]];
      for (let j = i + 1; j < n; j++) {
        if (standings[j].points === standings[i].points) {
          tiedPlayers.push(standings[j]);
        } else {
          break;
        }
      }

      if (tiedPlayers.length > 1) {
        // Calculate direct encounter among tied players
        for (const player of tiedPlayers) {
          const opponents = opponentMap.get(player.playerId)!;
          let dePoints = 0;
          let deGames = 0;

          for (const other of tiedPlayers) {
            if (other.playerId === player.playerId) continue;

            const match = opponents.get(other.playerId);
            if (match) {
              dePoints += match.result;
              deGames++;
            }
          }

          if (deGames > 0) {
            player.tiebreaks.directEncounter = {
              points: Math.round(dePoints * 100) / 100,
              games: deGames,
            };
          }
        }

        // Re-sort tied group by direct encounter
        tiedPlayers.sort((a, b) => {
          const aDE = a.tiebreaks.directEncounter?.points || 0;
          const bDE = b.tiebreaks.directEncounter?.points || 0;
          if (bDE !== aDE) return bDE - aDE;

          // Fall back to other tiebreaks
          if (b.tiebreaks.buchholz !== a.tiebreaks.buchholz) {
            return b.tiebreaks.buchholz - a.tiebreaks.buchholz;
          }
          if (b.tiebreaks.sonnebornBerger !== a.tiebreaks.sonnebornBerger) {
            return b.tiebreaks.sonnebornBerger - a.tiebreaks.sonnebornBerger;
          }
          return a.seed - b.seed;
        });
      }
    }
  }

  /**
   * Check if two players have the same overall score and tiebreaks
   */
  private hasSameScore(
    a: StandingsWithTiebreaks['standings'][number],
    b: StandingsWithTiebreaks['standings'][number],
  ): boolean {
    return (
      a.points === b.points &&
      a.tiebreaks.buchholz === b.tiebreaks.buchholz &&
      a.tiebreaks.sonnebornBerger === b.tiebreaks.sonnebornBerger &&
      a.tiebreaks.progressScore === b.tiebreaks.progressScore
    );
  }

  /**
   * Get detailed tiebreak explanation for a specific player
   */
  async getTiebreakDetails(tournamentId: string, playerId: string) {
    const standings = await this.calculateStandings(tournamentId);
    const playerStanding = standings.standings.find((s) => s.playerId === playerId);

    if (!playerStanding) {
      throw new NotFoundException('Player not found in tournament');
    }

    // Get detailed opponent information
    const tournamentPlayers = await this.prisma.tournamentPlayer.findMany({
      where: { tournamentId },
      include: {
        player: true,
        results: true,
      },
    });

    const playerData = tournamentPlayers.find((tp) => tp.playerId === playerId);
    if (!playerData) {
      throw new NotFoundException('Player data not found');
    }

    const opponentDetails = playerData.results.map((result) => {
      const opponent = tournamentPlayers.find((tp) => tp.playerId === result.opponentId);
      const opponentTotalScore = tournamentPlayers
        .find((tp) => tp.playerId === result.opponentId)
        ?.results.reduce((sum, r) => sum + parseFloat(r.result), 0) || 0;

      return {
        opponentId: result.opponentId,
        opponentName: opponent
          ? `${opponent.player.firstName} ${opponent.player.lastName}`
          : 'Unknown',
        opponentSeed: opponent?.seed || 0,
        opponentFinalScore: opponentTotalScore,
        result: result.result,
        color: result.color,
        roundNumber: 0, // Disabled - round relation not included
        sonnebornBergerContribution:
          parseFloat(result.result) === 1
            ? opponentTotalScore
            : parseFloat(result.result) === 0.5
              ? opponentTotalScore * 0.5
              : 0,
      };
    });

    return {
      player: {
        id: playerData.playerId,
        name: playerStanding.name,
        seed: playerData.seed,
        finalPoints: playerStanding.points,
      },
      tiebreaks: {
        buchholz: {
          value: playerStanding.tiebreaks.buchholz,
          explanation: 'Sum of all opponents final scores',
          opponents: opponentDetails.map((o) => ({
            name: o.opponentName,
            score: o.opponentFinalScore,
          })),
        },
        buchholzMedian: {
          value: playerStanding.tiebreaks.buchholzMedian,
          explanation: 'Buchholz excluding highest and lowest opponent scores',
        },
        sonnebornBerger: {
          value: playerStanding.tiebreaks.sonnebornBerger,
          explanation: 'Sum of defeated opponents scores + half of drawn opponents scores',
          breakdown: opponentDetails
            .filter((o) => parseFloat(o.result) > 0)
            .map((o) => ({
              opponent: o.opponentName,
              result: o.result,
              contribution: o.sonnebornBergerContribution,
            })),
        },
        progressScore: {
          value: playerStanding.tiebreaks.progressScore,
          explanation: 'Cumulative score after each round, summed',
        },
        directEncounter: playerStanding.tiebreaks.directEncounter
          ? {
              value: playerStanding.tiebreaks.directEncounter.points,
              explanation: 'Head-to-head record against players with same final score',
              games: playerStanding.tiebreaks.directEncounter.games,
            }
          : null,
      },
      rank: playerStanding.rank,
    };
  }
}
