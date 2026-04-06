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
  Optional,
} from '@nestjs/common';
import { TournamentService } from './tournament.service';
import { CreateTournamentDto, UpdateTournamentDto } from './dto/create-tournament.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('tournaments')
export class TournamentController {
  constructor(private tournamentService: TournamentService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Req() req: any, @Body() createDto: CreateTournamentDto) {
    return this.tournamentService.create(req.user.userId, createDto);
  }

  @Get()
  async findAll(
    @Req() req: any,
    @Query('status') status?: string,
    @Query('isPublic') isPublic?: boolean,
    @Query('country') country?: string,
    @Query('format') format?: string,
    @Query('search') search?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const filters: any = {};
    if (status) filters.status = status;
    if (isPublic !== undefined) filters.isPublic = isPublic;
    if (country) filters.country = country;
    if (format) filters.format = format;
    if (search) filters.search = search;
    if (page) filters.page = page;
    if (limit) filters.limit = limit;

    const userId = req.user?.userId;
    return this.tournamentService.findAll(userId, filters);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.tournamentService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async update(
    @Req() req: any,
    @Param('id') id: string,
    @Body() updateDto: UpdateTournamentDto,
  ) {
    return this.tournamentService.update(id, req.user.userId, updateDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async delete(@Req() req: any, @Param('id') id: string) {
    return this.tournamentService.delete(id, req.user.userId);
  }

  // Player management - all require auth
  @Post(':id/players')
  @UseGuards(JwtAuthGuard)
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
  @UseGuards(JwtAuthGuard)
  async removePlayer(
    @Req() req: any,
    @Param('id') tournamentId: string,
    @Param('playerId') playerId: string,
  ) {
    return this.tournamentService.removePlayer(tournamentId, playerId, req.user.userId);
  }

  @Post(':id/players/:playerId/withdraw')
  @UseGuards(JwtAuthGuard)
  async withdrawPlayer(
    @Param('id') tournamentId: string,
    @Param('playerId') playerId: string,
    @Body() body: { roundNumber?: number },
  ) {
    return this.tournamentService.withdrawPlayer(tournamentId, playerId, body.roundNumber);
  }

  // Round management - all require auth
  @Post(':id/rounds')
  @UseGuards(JwtAuthGuard)
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
  @UseGuards(JwtAuthGuard)
  async publishRound(
    @Param('id') tournamentId: string,
    @Param('roundId') roundId: string,
  ) {
    return this.tournamentService.publishRound(tournamentId, roundId);
  }

  @Post(':id/rounds/:roundId/complete')
  @UseGuards(JwtAuthGuard)
  async completeRound(@Param('roundId') roundId: string) {
    return this.tournamentService.completeRound(roundId);
  }

  // Pairing management - all require auth
  @Post(':id/pairings')
  @UseGuards(JwtAuthGuard)
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
  @UseGuards(JwtAuthGuard)
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
