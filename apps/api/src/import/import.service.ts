import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WebhookService } from '../webhook/webhook.service';
import { WebhookEvents } from '../webhook/webhook.events';

export interface ParsedPgnGame {
  event: string;
  site: string;
  date: string;
  round: string;
  white: string;
  black: string;
  result: string;
  whiteElo?: number;
  blackElo?: number;
  moves?: string;
  headers: Record<string, string>;
}

@Injectable()
export class ImportService {
  constructor(
    private prisma: PrismaService,
    private webhookService: WebhookService,
  ) {}

  /**
   * Import players from CSV
   * Expected format: FirstName,LastName,Email,FIDE ID,Rating
   */
  async importPlayersFromCsv(userId: string, tournamentId: string, csvContent: string): Promise<{
    imported: number;
    skipped: number;
    errors: string[];
  }> {
    const tournament = await this.prisma.tournament.findUnique({
      where: { id: tournamentId },
    });

    if (!tournament) {
      throw new BadRequestException('Tournament not found');
    }

    if (!tournament.registrationOpen) {
      throw new BadRequestException('Registration is closed');
    }

    const lines = csvContent.split('\n').filter((line) => line.trim());
    const errors: string[] = [];
    let imported = 0;
    let skipped = 0;

    // Skip header if present
    const startIndex = lines[0].toLowerCase().includes('first') ? 1 : 0;

    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const parts = this.parseCsvLine(line);

      if (parts.length < 2) {
        errors.push(`Line ${i + 1}: Invalid format - need at least FirstName,LastName`);
        skipped++;
        continue;
      }

      const [firstName, lastName, email, fideId, ratingStr] = parts;

      if (!firstName || !lastName) {
        errors.push(`Line ${i + 1}: Missing name`);
        skipped++;
        continue;
      }

      const rating = ratingStr ? parseInt(ratingStr, 10) : null;
      if (ratingStr && (isNaN(rating!) || rating! < 0)) {
        errors.push(`Line ${i + 1}: Invalid rating "${ratingStr}"`);
        skipped++;
        continue;
      }

      try {
        // Check if player already exists
        let player = await this.prisma.player.findFirst({
          where: {
            ownerId: userId,
            OR: [
              { email: email || undefined },
              { AND: [{ firstName }, { lastName }] },
            ],
          },
        });

        if (!player) {
          // Create new player
          player = await this.prisma.player.create({
            data: {
              ownerId: userId,
              firstName,
              lastName,
              email: email || null,
              fideId: fideId || null,
              rating: rating || 0,
            },
          });
        }

        // Add player to tournament
        const existingRegistration = await this.prisma.tournamentPlayer.findUnique({
          where: {
            tournamentId_playerId: {
              tournamentId,
              playerId: player.id,
            },
          },
        });

        if (existingRegistration) {
          errors.push(`Line ${i + 1}: Player ${firstName} ${lastName} already registered`);
          skipped++;
          continue;
        }

        // Check max players
        if (tournament.maxPlayers) {
          const count = await this.prisma.tournamentPlayer.count({
            where: { tournamentId },
          });
          if (count >= tournament.maxPlayers) {
            throw new BadRequestException('Tournament is full');
          }
        }

        const seed = (await this.prisma.tournamentPlayer.count({ where: { tournamentId } })) + 1;

        await this.prisma.tournamentPlayer.create({
          data: {
            tournamentId,
            playerId: player.id,
            seed,
            rating: rating || player.rating,
          },
        });

        await this.webhookService.publish(WebhookEvents.PLAYER_REGISTERED, {
          tournamentId,
          playerId: player.id,
          name: `${firstName} ${lastName}`,
        });

        imported++;
      } catch (err: any) {
        errors.push(`Line ${i + 1}: ${err.message}`);
        skipped++;
      }
    }

    return { imported, skipped, errors };
  }

  /**
   * Parse PGN content and extract games
   */
  async parsePgn(pgnContent: string): Promise<ParsedPgnGame[]> {
    const games: ParsedPgnGame[] = [];
    const gameBlocks = this.splitPgnIntoGames(pgnContent);

    for (const block of gameBlocks) {
      const game = this.parsePgnGame(block);
      if (game) {
        games.push(game);
      }
    }

    return games;
  }

  /**
   * Import results from PGN (for completed games)
   */
  async importResultsFromPgn(
    tournamentId: string,
    pgnContent: string,
  ): Promise<{
    imported: number;
    skipped: number;
    errors: string[];
  }> {
    const tournament = await this.prisma.tournament.findUnique({
      where: { id: tournamentId },
    });

    if (!tournament) {
      throw new BadRequestException('Tournament not found');
    }

    const games = await this.parsePgn(pgnContent);
    const errors: string[] = [];
    let imported = 0;
    let skipped = 0;

    for (const game of games) {
      try {
        const roundNumber = parseInt(game.round, 10);
        if (isNaN(roundNumber)) {
          errors.push(`Game ${game.white} vs ${game.black}: Invalid round "${game.round}"`);
          skipped++;
          continue;
        }

        // Find the round
        const round = await this.prisma.round.findFirst({
          where: {
            tournamentId,
            roundNumber,
          },
        });

        if (!round) {
          errors.push(`Game ${game.white} vs ${game.black}: Round ${roundNumber} not found`);
          skipped++;
          continue;
        }

        // Find players by name
        const whitePlayer = await this.findPlayerByName(game.white);
        const blackPlayer = await this.findPlayerByName(game.black);

        if (!whitePlayer || !blackPlayer) {
          errors.push(`Game ${game.white} vs ${game.black}: Player not found`);
          skipped++;
          continue;
        }

        // Find the pairing
        const pairing = await this.prisma.pairing.findFirst({
          where: {
            roundId: round.id,
            whiteId: whitePlayer.id,
            blackId: blackPlayer.id,
          },
        });

        if (!pairing) {
          errors.push(`Game ${game.white} vs ${game.black}: Pairing not found`);
          skipped++;
          continue;
        }

        // Update pairing with result
        let whiteScore: number;
        let blackScore: number;

        if (game.result === '1-0') {
          whiteScore = 1;
          blackScore = 0;
        } else if (game.result === '0-1') {
          whiteScore = 0;
          blackScore = 1;
        } else if (game.result === '1/2-1/2') {
          whiteScore = 0.5;
          blackScore = 0.5;
        } else {
          errors.push(`Game ${game.white} vs ${game.black}: Invalid result "${game.result}"`);
          skipped++;
          continue;
        }

        await this.prisma.pairing.update({
          where: { id: pairing.id },
          data: {
            result: game.result,
            whiteScore,
            blackScore,
            status: 'completed',
          },
        });

        // Create result records (delete existing first)
        await this.prisma.result.deleteMany({
          where: {
            roundId: round.id,
            OR: [{ playerId: whitePlayer.id }, { playerId: blackPlayer.id }],
          },
        });

        const whiteTournamentPlayer = await this.prisma.tournamentPlayer.findUnique({
          where: {
            tournamentId_playerId: {
              tournamentId,
              playerId: whitePlayer.id,
            },
          },
        });

        const blackTournamentPlayer = await this.prisma.tournamentPlayer.findUnique({
          where: {
            tournamentId_playerId: {
              tournamentId,
              playerId: blackPlayer.id,
            },
          },
        });

        if (whiteTournamentPlayer && blackTournamentPlayer) {
          await this.prisma.result.create({
            data: {
              tournamentId,
              playerId: whitePlayer.id,
              tournamentPlayerId: whiteTournamentPlayer.id,
              roundId: round.id,
              opponentId: blackPlayer.id,
              color: 'W',
              result: whiteScore.toString(),
            },
          });

          await this.prisma.result.create({
            data: {
              tournamentId,
              playerId: blackPlayer.id,
              tournamentPlayerId: blackTournamentPlayer.id,
              roundId: round.id,
              opponentId: whitePlayer.id,
              color: 'B',
              result: blackScore.toString(),
            },
          });
        }

        await this.webhookService.publish(WebhookEvents.MATCH_RESULT_SUBMITTED, {
          pairingId: pairing.id,
          roundId: round.id,
          result: game.result,
          white: game.white,
          black: game.black,
        });

        imported++;
      } catch (err: any) {
        errors.push(`Game ${game.white} vs ${game.black}: ${err.message}`);
        skipped++;
      }
    }

    return { imported, skipped, errors };
  }

  /**
   * Parse a single PGN game block
   */
  private parsePgnGame(block: string): ParsedPgnGame | null {
    const headers: Record<string, string> = {};
    const lines = block.split('\n');
    let movesStart = -1;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) {
        movesStart = i + 1;
        break;
      }

      const headerMatch = line.match(/^\[(\w+)\s+"([^"]*)"\]$/);
      if (headerMatch) {
        headers[headerMatch[1]] = headerMatch[2];
      }
    }

    const moves = movesStart >= 0 ? lines.slice(movesStart).join(' ').trim() : '';

    // Extract required fields
    const event = headers['Event'] || 'Unknown';
    const site = headers['Site'] || 'Unknown';
    const date = headers['Date'] || '????.??.??';
    const round = headers['Round'] || '?';
    const white = headers['White'] || 'Unknown';
    const black = headers['Black'] || 'Unknown';
    const result = headers['Result'] || '*';
    const whiteElo = headers['WhiteElo'] ? parseInt(headers['WhiteElo'], 10) : undefined;
    const blackElo = headers['BlackElo'] ? parseInt(headers['BlackElo'], 10) : undefined;

    // Remove move number comments and variations from moves
    const cleanMoves = moves
      .replace(/\{[^}]*\}/g, '') // Remove comments in braces
      .replace(/\([^)]*\)/g, '') // Remove variations in parentheses
      .replace(/\d+\./g, '') // Remove move numbers
      .replace(/\s+/g, ' ')
      .trim();

    return {
      event,
      site,
      date,
      round,
      white,
      black,
      result,
      whiteElo,
      blackElo,
      moves: cleanMoves || undefined,
      headers,
    };
  }

  /**
   * Split PGN content into individual game blocks
   */
  private splitPgnIntoGames(pgnContent: string): string[] {
    const games: string[] = [];
    let currentGame = '';
    let inHeaders = true;

    const lines = pgnContent.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();

      // Skip empty lines at the start
      if (!currentGame && !trimmed) continue;

      // Detect header vs moves section
      if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
        if (!inHeaders && currentGame) {
          // New game starting
          games.push(currentGame.trim());
          currentGame = '';
        }
        inHeaders = true;
        currentGame += line + '\n';
      } else if (trimmed) {
        inHeaders = false;
        currentGame += line + '\n';
      } else if (currentGame) {
        currentGame += line + '\n';
      }
    }

    // Don't forget the last game
    if (currentGame.trim()) {
      games.push(currentGame.trim());
    }

    return games;
  }

  /**
   * Find player by name (from PGN)
   */
  private async findPlayerByName(name: string) {
    const parts = name.split(' ');
    const lastName = parts.pop() || '';
    const firstName = parts.join(' ') || '';

    // Try exact match first
    const player = await this.prisma.player.findFirst({
      where: {
        firstName: { contains: firstName, mode: 'insensitive' },
        lastName: { contains: lastName, mode: 'insensitive' },
      },
    });

    return player;
  }

  /**
   * Parse a CSV line respecting quoted fields
   */
  private parseCsvLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    result.push(current.trim());
    return result;
  }
}
