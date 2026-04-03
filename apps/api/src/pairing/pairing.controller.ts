import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { PairingService } from './pairing.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('tournaments/:tournamentId/pairings')
@UseGuards(JwtAuthGuard)
export class PairingController {
  constructor(private pairingService: PairingService) {}

  /**
   * Generate Swiss system pairings for a specific round
   */
  @Post('generate/swiss')
  async generateSwiss(
    @Req() req: any,
    @Param('tournamentId') tournamentId: string,
    @Body() body: { roundNumber: number },
  ) {
    if (!body.roundNumber) {
      throw new BadRequestException('roundNumber is required');
    }
    return this.pairingService.generateSwissPairings(tournamentId, body.roundNumber);
  }

  /**
   * Generate all Round-Robin pairings at once
   */
  @Post('generate/roundrobin')
  async generateRoundRobin(
    @Req() req: any,
    @Param('tournamentId') tournamentId: string,
  ) {
    return this.pairingService.generateRoundRobinPairings(tournamentId);
  }

  /**
   * Generate Elimination bracket pairings for a round
   */
  @Post('generate/elimination')
  async generateElimination(
    @Req() req: any,
    @Param('tournamentId') tournamentId: string,
    @Body() body: { roundNumber: number },
  ) {
    if (!body.roundNumber) {
      throw new BadRequestException('roundNumber is required');
    }
    return this.pairingService.generateEliminationPairings(tournamentId, body.roundNumber);
  }
}
