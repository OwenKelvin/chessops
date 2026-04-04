import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { TournamentService } from './tournament.service';
import { CreateTournamentDto, UpdateTournamentDto } from './dto/create-tournament.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('tournaments')
@UseGuards(JwtAuthGuard)
export class TournamentController {
  constructor(private tournamentService: TournamentService) {}

  @Post()
  async create(@Req() req: any, @Body() createDto: CreateTournamentDto) {
    return this.tournamentService.create(req.user.userId, createDto);
  }

  @Get()
  async findAll(
    @Req() req: any,
    @Query('status') status?: string,
    @Query('isPublic') isPublic?: boolean,
  ) {
    const filters: any = {};
    if (status) filters.status = status;
    if (isPublic !== undefined) filters.isPublic = isPublic;
    return this.tournamentService.findAll(req.user.userId, filters);
  }

  @Get(':id')
  async findOne(@Req() req: any, @Param('id') id: string) {
    return this.tournamentService.findOne(id, req.user.userId);
  }

  @Patch(':id')
  async update(
    @Req() req: any,
    @Param('id') id: string,
    @Body() updateDto: UpdateTournamentDto,
  ) {
    return this.tournamentService.update(id, req.user.userId, updateDto);
  }

  @Delete(':id')
  async delete(@Req() req: any, @Param('id') id: string) {
    return this.tournamentService.delete(id, req.user.userId);
  }

  // Player management
  @Post(':id/players')
  async addPlayer(
    @Req() req: any,
    @Param('id') tournamentId: string,
    @Body() body: { playerId: string; seed?: number; rating?: number },
  ) {
    if (!body.playerId) {
      throw new BadRequestException('playerId is required');
    }
    return this.tournamentService.addPlayer(
      tournamentId,
      body.playerId,
      body.seed,
      body.rating,
    );
  }

  @Delete(':id/players/:playerId')
  async removePlayer(
    @Req() req: any,
    @Param('id') tournamentId: string,
    @Param('playerId') playerId: string,
  ) {
    return this.tournamentService.removePlayer(tournamentId, playerId, req.user.userId);
  }

  @Post(':id/players/:playerId/withdraw')
  async withdrawPlayer(
    @Param('id') tournamentId: string,
    @Param('playerId') playerId: string,
    @Body() body: { roundNumber?: number },
  ) {
    return this.tournamentService.withdrawPlayer(tournamentId, playerId, body.roundNumber);
  }

  // Round management
  @Post(':id/rounds')
  async createRound(
    @Param('id') tournamentId: string,
    @Body() body: { roundNumber: number; name?: string },
  ) {
    if (!body.roundNumber) {
      throw new BadRequestException('roundNumber is required');
    }
    return this.tournamentService.createRound(tournamentId, body.roundNumber, body.name);
  }

  @Post(':id/rounds/:roundId/publish')
  async publishRound(
    @Param('id') tournamentId: string,
    @Param('roundId') roundId: string,
  ) {
    return this.tournamentService.publishRound(tournamentId, roundId);
  }

  @Post(':id/rounds/:roundId/complete')
  async completeRound(@Param('roundId') roundId: string) {
    return this.tournamentService.completeRound(roundId);
  }

  // Pairing management
  @Post(':id/pairings')
  async createPairing(
    @Param('id') tournamentId: string,
    @Body() body: { roundId: string; whiteId: string; blackId: string; boardNumber?: number },
  ) {
    if (!body.roundId || !body.whiteId || !body.blackId) {
      throw new BadRequestException('roundId, whiteId, and blackId are required');
    }
    return this.tournamentService.createPairing(
      body.roundId,
      body.whiteId,
      body.blackId,
      body.boardNumber,
    );
  }

  @Post(':id/results')
  async submitResult(
    @Param('id') tournamentId: string,
    @Body() body: { pairingId: string; result: string },
  ) {
    if (!body.pairingId || !body.result) {
      throw new BadRequestException('pairingId and result are required');
    }
    return this.tournamentService.submitResult(body.pairingId, body.result);
  }

}
