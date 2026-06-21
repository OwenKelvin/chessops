import {
  Controller,
  Get,
  Param,
} from '@nestjs/common';
import { TiebreakService } from './tiebreak.service';

@Controller('tournaments/:tournamentId/standings')
export class TiebreakController {
  constructor(private tiebreakService: TiebreakService) {}

  /**
   * Get full standings with all tiebreak calculations
   */
  @Get()
  async getStandings(@Param('tournamentId') tournamentId: string) {
    return this.tiebreakService.calculateStandings(tournamentId);
  }

  /**
   * Get detailed tiebreak explanation for a specific player
   */
  @Get(':playerId/details')
  async getTiebreakDetails(
    @Param('tournamentId') tournamentId: string,
    @Param('playerId') playerId: string,
  ) {
    return this.tiebreakService.getTiebreakDetails(tournamentId, playerId);
  }

  /**
   * Get standings sorted by a specific tiebreak system
   */
  @Get('by/:tiebreak')
  async getByTiebreak(
    @Param('tournamentId') tournamentId: string,
    @Param('tiebreak') tiebreak: string,
  ) {
    const standings = await this.tiebreakService.calculateStandings(tournamentId);

    const tiebreakMap: Record<string, (s: any) => number> = {
      buchholz: (s) => s.tiebreaks.buchholz,
      sonneborn: (s) => s.tiebreaks.sonnebornBerger,
      progress: (s) => s.tiebreaks.progressScore,
      direct: (s) => s.tiebreaks.directEncounter?.points || 0,
      rating: (s) => s.rating,
    };

    const sorter = tiebreakMap[tiebreak.toLowerCase()];
    if (!sorter) {
      return {
        error: 'Invalid tiebreak type',
        valid: Object.keys(tiebreakMap),
      };
    }

    standings.standings.sort((a, b) => {
      const diff = sorter(b) - sorter(a);
      return diff !== 0 ? diff : a.seed - b.seed;
    });

    return {
      tournamentId,
      sortedBy: tiebreak,
      standings: standings.standings,
    };
  }
}
