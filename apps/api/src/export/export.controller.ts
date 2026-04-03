import {
  Controller,
  Get,
  Param,
  Res,
  UseGuards,
  Req,
  Query,
} from '@nestjs/common';
import { Response } from 'express';
import { ExportService } from './export.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('tournaments/:tournamentId/export')
@UseGuards(JwtAuthGuard)
export class ExportController {
  constructor(private exportService: ExportService) {}

  /**
   * Export tournament games to PGN
   */
  @Get('pgn')
  async exportPgn(
    @Req() req: any,
    @Param('tournamentId') tournamentId: string,
    @Res() res: Response,
  ) {
    const pgn = await this.exportService.exportToPgn(tournamentId);

    const tournament = await this.exportService['prisma'].tournament.findUnique({
      where: { id: tournamentId },
    });

    const filename = `${(tournament?.name || 'tournament').replace(/[^a-z0-9]/gi, '_')}.pgn`;

    res.setHeader('Content-Type', 'application/x-chess-pgn');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(pgn);
  }

  /**
   * Export specific player's games to PGN
   */
  @Get('pgn/player/:playerId')
  async exportPlayerPgn(
    @Req() req: any,
    @Param('tournamentId') tournamentId: string,
    @Param('playerId') playerId: string,
    @Res() res: Response,
  ) {
    const pgn = await this.exportService.exportPlayerGamesToPgn(tournamentId, playerId);

    const player = await this.exportService['prisma'].player.findUnique({
      where: { id: playerId },
    });

    const filename = `${(player?.firstName + '_' + player?.lastName || 'player').replace(/[^a-z0-9]/gi, '_')}_games.pgn`;

    res.setHeader('Content-Type', 'application/x-chess-pgn');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(pgn);
  }

  /**
   * Export tournament results to CSV
   */
  @Get('csv')
  async exportCsv(
    @Req() req: any,
    @Param('tournamentId') tournamentId: string,
    @Res() res: Response,
  ) {
    const csv = await this.exportService.exportToCsv(tournamentId);

    const tournament = await this.exportService['prisma'].tournament.findUnique({
      where: { id: tournamentId },
    });

    const filename = `${(tournament?.name || 'tournament').replace(/[^a-z0-9]/gi, '_')}_results.csv`;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);
  }

  /**
   * Export player list to CSV
   */
  @Get('csv/players')
  async exportPlayersCsv(
    @Req() req: any,
    @Param('tournamentId') tournamentId: string,
    @Res() res: Response,
  ) {
    const csv = await this.exportService.exportPlayersToCsv(tournamentId);

    const tournament = await this.exportService['prisma'].tournament.findUnique({
      where: { id: tournamentId },
    });

    const filename = `${(tournament?.name || 'tournament').replace(/[^a-z0-9]/gi, '_')}_players.csv`;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);
  }
}
