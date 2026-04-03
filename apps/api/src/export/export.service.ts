import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface PgnGame {
  event: string;
  site: string;
  date: string;
  round: string;
  white: string;
  black: string;
  result: string;
  whiteElo?: number;
  blackElo?: number;
  moves: string;
  headers: Record<string, string>;
}

@Injectable()
export class ExportService {
  constructor(private prisma: PrismaService) {}

  /**
   * Export tournament games to PGN format
   */
  async exportToPgn(tournamentId: string): Promise<string> {
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
              where: {
                status: 'completed',
                result: {
                  not: null,
                },
              },
              orderBy: { boardNumber: 'asc' },
            },
          },
          orderBy: { roundNumber: 'asc' },
        },
      },
    });

    if (!tournament) {
      throw new NotFoundException('Tournament not found');
    }

    const pgnGames: string[] = [];

    for (const round of tournament.rounds) {
      for (const pairing of round.pairings) {
        const pgn = this.formatPgnGame({
          event: tournament.name,
          site: tournament.location || 'Online',
          date: tournament.startDate.toISOString().split('T')[0],
          round: round.roundNumber.toString(),
          white: `${pairing.white.firstName} ${pairing.white.lastName}`,
          black: `${pairing.black.firstName} ${pairing.black.lastName}`,
          result: pairing.result!,
          whiteElo: pairing.white.rating || undefined,
          blackElo: pairing.black.rating || undefined,
          moves: '', // Moves would need to be stored separately
          headers: {
            'Board': pairing.boardNumber?.toString() || '',
            'TournamentId': tournamentId,
            'RoundId': round.id,
            'PairingId': pairing.id,
            'Format': tournament.format,
            'TimeControl': tournament.timeControl || '',
          },
        });
        pgnGames.push(pgn);
      }
    }

    // Add tournament info comment at the top
    const header = [
      `; Tournament: ${tournament.name}`,
      `; Location: ${tournament.location || 'Online'}`,
      `; Start Date: ${tournament.startDate.toISOString().split('T')[0]}`,
      `; End Date: ${tournament.endDate ? tournament.endDate.toISOString().split('T')[0] : 'TBD'}`,
      `; Format: ${tournament.format}`,
      `; Total Games: ${pgnGames.length}`,
      `; Generated: ${new Date().toISOString()}`,
      '',
    ].join('\n');

    return header + pgnGames.join('\n');
  }

  /**
   * Export specific player's games to PGN
   */
  async exportPlayerGamesToPgn(tournamentId: string, playerId: string): Promise<string> {
    const player = await this.prisma.player.findUnique({
      where: { id: playerId },
    });

    if (!player) {
      throw new NotFoundException('Player not found');
    }

    const tournament = await this.prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: {
        rounds: {
          include: {
            pairings: {
              where: {
                status: 'completed',
                OR: [{ whiteId: playerId }, { blackId: playerId }],
              },
              include: {
                white: true,
                black: true,
              },
              orderBy: { boardNumber: 'asc' },
            },
          },
          orderBy: { roundNumber: 'asc' },
        },
      },
    });

    if (!tournament) {
      throw new NotFoundException('Tournament not found');
    }

    const pgnGames: string[] = [];

    for (const round of tournament.rounds) {
      for (const pairing of round.pairings) {
        const isWhite = pairing.whiteId === playerId;
        const opponent = isWhite ? pairing.black : pairing.white;

        const pgn = this.formatPgnGame({
          event: tournament.name,
          site: tournament.location || 'Online',
          date: tournament.startDate.toISOString().split('T')[0],
          round: round.roundNumber.toString(),
          white: `${pairing.white.firstName} ${pairing.white.lastName}`,
          black: `${pairing.black.firstName} ${pairing.black.lastName}`,
          result: pairing.result!,
          whiteElo: pairing.white.rating || undefined,
          blackElo: pairing.black.rating || undefined,
          moves: '',
          headers: {
            'PlayerColor': isWhite ? 'White' : 'Black',
            'Opponent': `${opponent.firstName} ${opponent.lastName}`,
            'TournamentId': tournamentId,
            'RoundId': round.id,
            'PairingId': pairing.id,
          },
        });
        pgnGames.push(pgn);
      }
    }

    const header = [
      `; Player: ${player.firstName} ${player.lastName}`,
      `; Tournament: ${tournament.name}`,
      `; Games: ${pgnGames.length}`,
      `; Generated: ${new Date().toISOString()}`,
      '',
    ].join('\n');

    return header + pgnGames.join('\n');
  }

  /**
   * Export all player games to CSV format
   */
  async exportToCsv(tournamentId: string): Promise<string> {
    const tournament = await this.prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: {
        rounds: {
          include: {
            pairings: {
              where: { status: 'completed' },
              include: {
                white: true,
                black: true,
              },
            },
          },
        },
      },
    });

    if (!tournament) {
      throw new NotFoundException('Tournament not found');
    }

    const rows: string[] = [];
    rows.push('Round,Board,White Player,White Rating,Black Player,Black Rating,Result,White Score,Black Score');

    for (const round of tournament.rounds) {
      for (const pairing of round.pairings) {
        rows.push([
          round.roundNumber.toString(),
          pairing.boardNumber?.toString() || '',
          `${pairing.white.firstName} ${pairing.white.lastName}`,
          pairing.white.rating?.toString() || '',
          `${pairing.black.firstName} ${pairing.black.lastName}`,
          pairing.black.rating?.toString() || '',
          pairing.result || '',
          pairing.whiteScore?.toString() || '',
          pairing.blackScore?.toString() || '',
        ].join(','));
      }
    }

    return rows.join('\n');
  }

  /**
   * Export player list to CSV
   */
  async exportPlayersToCsv(tournamentId: string): Promise<string> {
    const tournamentPlayers = await this.prisma.tournamentPlayer.findMany({
      where: { tournamentId },
      include: {
        player: true,
        results: true,
      },
      orderBy: { seed: 'asc' },
    });

    const rows: string[] = [];
    rows.push('Seed,First Name,Last Name,Email,FIDE ID,Rating,Games,Points,Wins,Draws,Losses,Status');

    for (const tp of tournamentPlayers) {
      const points = tp.results.reduce((sum, r) => sum + parseFloat(r.result), 0);
      const wins = tp.results.filter((r) => r.result === '1').length;
      const draws = tp.results.filter((r) => r.result === '0.5').length;
      const losses = tp.results.filter((r) => r.result === '0').length;

      rows.push([
        tp.seed.toString(),
        tp.player.firstName,
        tp.player.lastName,
        tp.player.email || '',
        tp.player.fideId || '',
        tp.player.rating?.toString() || tp.rating?.toString() || '',
        tp.results.length.toString(),
        points.toString(),
        wins.toString(),
        draws.toString(),
        losses.toString(),
        tp.status,
      ].join(','));
    }

    return rows.join('\n');
  }

  /**
   * Format a single PGN game
   */
  private formatPgnGame(game: PgnGame): string {
    const headers: string[] = [];

    // Required PGN headers (the Seven Tag Roster)
    headers.push(`[Event "${this.escapePgn(game.event)}"]`);
    headers.push(`[Site "${this.escapePgn(game.site)}"]`);
    headers.push(`[Date "${game.date}"]`);
    headers.push(`[Round "${game.round}"]`);
    headers.push(`[White "${this.escapePgn(game.white)}"]`);
    headers.push(`[Black "${this.escapePgn(game.black)}"]`);
    headers.push(`[Result "${game.result}"]`);

    // Optional headers
    if (game.whiteElo) {
      headers.push(`[WhiteElo "${game.whiteElo}"]`);
    }
    if (game.blackElo) {
      headers.push(`[BlackElo "${game.blackElo}"]`);
    }

    // Additional headers
    for (const [key, value] of Object.entries(game.headers)) {
      if (value) {
        headers.push(`[${key} "${this.escapePgn(value)}"]`);
      }
    }

    // Add moves (empty if not provided)
    headers.push(''); // Empty line before moves
    if (game.moves) {
      headers.push(game.moves);
    } else {
      headers.push('*'); // Asterisk for unknown moves
    }

    return headers.join('\n');
  }

  /**
   * Escape special characters in PGN strings
   */
  private escapePgn(str: string): string {
    return str.replace(/"/g, '\\"').replace(/\\/g, '\\\\');
  }
}
