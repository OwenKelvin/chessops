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
import { TournamentAdminGuard } from './guards/tournament-admin.guard';

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

  @Get(':idOrSlug')
  async findOne(@Param('idOrSlug') idOrSlug: string) {
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug)) {
      return this.tournamentService.findOne(idOrSlug);
    }
    return this.tournamentService.findBySlug(idOrSlug);
  }

  @Get('by-slug/:slug')
  async findBySlug(@Param('slug') slug: string) {
    return this.tournamentService.findBySlug(slug);
  }

  @Patch(':idOrSlug')
  @UseGuards(JwtAuthGuard)
  async update(
    @Req() req: any,
    @Param('idOrSlug') idOrSlug: string,
    @Body() updateDto: UpdateTournamentDto,
  ) {
    return this.tournamentService.update(idOrSlug, req.user.userId, updateDto);
  }

  @Delete(':idOrSlug')
  @UseGuards(JwtAuthGuard)
  async delete(@Req() req: any, @Param('idOrSlug') idOrSlug: string) {
    return this.tournamentService.delete(idOrSlug, req.user.userId);
  }

  // Player management - all require auth (owner or admin)
  @Post(':idOrSlug/players')
  @UseGuards(JwtAuthGuard, TournamentAdminGuard)
  async addPlayer(
    @Req() req: any,
    @Param('idOrSlug') tournamentIdOrSlug: string,
    @Body() body: { playerId: string; seed?: number; rating?: number },
  ) {
    if (!body.playerId) {
      throw new BadRequestException('playerId is required');
    }
    return this.tournamentService.addPlayer(
      tournamentIdOrSlug,
      body.playerId,
      body.seed,
      body.rating,
    );
  }

  @Delete(':idOrSlug/players/:playerId')
  @UseGuards(JwtAuthGuard, TournamentAdminGuard)
  async removePlayer(
    @Req() req: any,
    @Param('idOrSlug') tournamentIdOrSlug: string,
    @Param('playerId') playerId: string,
  ) {
    return this.tournamentService.removePlayer(tournamentIdOrSlug, playerId, req.user.userId);
  }

  @Post(':idOrSlug/players/:playerId/withdraw')
  @UseGuards(JwtAuthGuard, TournamentAdminGuard)
  async withdrawPlayer(
    @Param('idOrSlug') tournamentIdOrSlug: string,
    @Param('playerId') playerId: string,
    @Body() body: { roundNumber?: number },
  ) {
    return this.tournamentService.withdrawPlayer(tournamentIdOrSlug, playerId, body.roundNumber);
  }

  // Round management - all require auth
  @Post(':idOrSlug/rounds')
  @UseGuards(JwtAuthGuard)
  async createRound(
    @Param('idOrSlug') tournamentIdOrSlug: string,
    @Body() body: { roundNumber: number; name?: string },
  ) {
    if (!body.roundNumber) {
      throw new BadRequestException('roundNumber is required');
    }
    return this.tournamentService.createRound(tournamentIdOrSlug, body.roundNumber, body.name);
  }

  @Post(':idOrSlug/rounds/:roundId/publish')
  @UseGuards(JwtAuthGuard)
  async publishRound(
    @Param('idOrSlug') tournamentIdOrSlug: string,
    @Param('roundId') roundId: string,
  ) {
    return this.tournamentService.publishRound(tournamentIdOrSlug, roundId);
  }

  @Post(':idOrSlug/rounds/:roundId/complete')
  @UseGuards(JwtAuthGuard)
  async completeRound(
    @Param('idOrSlug') tournamentIdOrSlug: string,
    @Param('roundId') roundId: string,
  ) {
    return this.tournamentService.completeRound(tournamentIdOrSlug, roundId);
  }

  // Pairing management - all require auth
  @Post(':idOrSlug/pairings')
  @UseGuards(JwtAuthGuard)
  async createPairing(
    @Param('idOrSlug') tournamentIdOrSlug: string,
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

  @Post(':idOrSlug/results')
  @UseGuards(JwtAuthGuard)
  async submitResult(
    @Param('idOrSlug') tournamentIdOrSlug: string,
    @Body() body: { pairingId: string; result: string },
  ) {
    if (!body.pairingId || !body.result) {
      throw new BadRequestException('pairingId and result are required');
    }
    return this.tournamentService.submitResult(body.pairingId, body.result);
  }

  // Admin management endpoints
  @Get(':idOrSlug/admins')
  async getAdmins(@Param('idOrSlug') tournamentIdOrSlug: string) {
    return this.tournamentService.getAdmins(tournamentIdOrSlug);
  }

  @Post(':idOrSlug/admins')
  @UseGuards(JwtAuthGuard, TournamentAdminGuard)
  async assignAdmin(
    @Req() req: any,
    @Param('idOrSlug') tournamentIdOrSlug: string,
    @Body() body: { playerId: string },
  ) {
    if (!body.playerId) {
      throw new BadRequestException('playerId is required');
    }
    return this.tournamentService.assignAdmin(tournamentIdOrSlug, body.playerId, req.user.userId);
  }

  @Delete(':idOrSlug/admins/:playerId')
  @UseGuards(JwtAuthGuard, TournamentAdminGuard)
  async revokeAdmin(
    @Req() req: any,
    @Param('idOrSlug') tournamentIdOrSlug: string,
    @Param('playerId') playerId: string,
  ) {
    return this.tournamentService.revokeAdmin(tournamentIdOrSlug, playerId, req.user.userId);
  }

}
