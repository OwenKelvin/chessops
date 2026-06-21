import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WebhookService } from '../webhook/webhook.service';
import { WebhookEvents } from '../webhook/webhook.events';

@Injectable()
export class TournamentService {
  constructor(
    private prisma: PrismaService,
    private webhookService: WebhookService,
  ) {}

  async create(userId: string, data: any) {
    const tournament = await this.prisma.tournament.create({
      data: {
        ownerId: userId,
        name: data.name,
        description: data.description,
        location: data.location,
        country: data.country,
        countryName: data.countryName,
        startDate: new Date(data.startDate),
        endDate: data.endDate ? new Date(data.endDate) : null,
        status: data.status || 'draft',
        format: data.format || 'swiss',
        maxRounds: Number(data.maxRounds) || 9,
        timeControl: data.timeControl,
        maxPlayers: Number(data.maxPlayers),
        isPublic: data.isPublic !== false,
        registrationOpen: data.registrationOpen !== false,
      },
    });

    await this.webhookService.publish(WebhookEvents.TOURNAMENT_CREATED, {
      tournamentId: tournament.id,
      name: tournament.name,
      ownerId: userId,
    });

    return tournament;
  }

  async findAll(
    userId: string | null,
    filters?: {
      status?: string;
      isPublic?: boolean;
      country?: string;
      format?: string;
      search?: string;
      page?: number;
      limit?: number;
    },
  ) {
    const where: any = {};

    // If user is not authenticated, only show public tournaments
    if (!userId) {
      where.isPublic = true;
    }

    if (filters?.status) {
      where.status = filters.status;
    }
    if (filters?.country) {
      where.country = filters.country;
    }
    if (filters?.format) {
      where.format = filters.format;
    }
    if (filters?.search) {
      where.name = { contains: filters.search, mode: 'insensitive' };
    }
    // Only apply isPublic filter if explicitly set (for authenticated users filtering their own tournaments)
    if (filters?.isPublic !== undefined) {
      where.isPublic = filters.isPublic;
    }

    const skip =
      filters?.page && filters?.limit
        ? (Number(filters.page) - 1) * Number(filters.limit)
        : undefined;
    const take = filters?.limit ? Number(filters.limit) : undefined;

    const [tournaments, total] = await Promise.all([
      this.prisma.tournament.findMany({
        where,
        include: {
          players: {
            include: { player: true },
          },
          _count: {
            select: { rounds: true, players: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.tournament.count({ where }),
    ]);

    return { tournaments, total };
  }

  async findOne(id: string) {
    const tournament = await this.prisma.tournament.findUnique({
      where: { id },
      include: {
        players: {
          include: { player: true },
        },
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

    return tournament;
  }

  async update(id: string, userId: string, data: any) {
    const tournament = await this.prisma.tournament.findFirst({
      where: { id, ownerId: userId },
    });

    if (!tournament) {
      throw new NotFoundException('Tournament not found');
    }

    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined)
      updateData.description = data.description;
    if (data.location !== undefined) updateData.location = data.location;
    if (data.startDate !== undefined)
      updateData.startDate = new Date(data.startDate);
    if (data.endDate !== undefined) updateData.endDate = new Date(data.endDate);
    if (data.status !== undefined) updateData.status = data.status;
    if (data.format !== undefined) updateData.format = data.format;
    if (data.maxRounds !== undefined) updateData.maxRounds = data.maxRounds;
    if (data.timeControl !== undefined)
      updateData.timeControl = data.timeControl;
    if (data.maxPlayers !== undefined) updateData.maxPlayers = data.maxPlayers;
    if (data.isPublic !== undefined) updateData.isPublic = data.isPublic;
    if (data.registrationOpen !== undefined)
      updateData.registrationOpen = data.registrationOpen;

    const updated = await this.prisma.tournament.update({
      where: { id },
      data: updateData,
    });

    await this.webhookService.publish(WebhookEvents.TOURNAMENT_UPDATED, {
      tournamentId: id,
      ...updateData,
    });

    return updated;
  }

  async delete(id: string, userId: string) {
    const tournament = await this.prisma.tournament.findFirst({
      where: { id, ownerId: userId },
    });

    if (!tournament) {
      throw new NotFoundException(
        'Tournament not found or you do not have permission to delete it',
      );
    }

    await this.prisma.tournament.delete({
      where: { id },
    });

    await this.webhookService.publish(WebhookEvents.TOURNAMENT_CANCELLED, {
      tournamentId: id,
      name: tournament.name,
    });

    return { success: true };
  }

  // Player management
  async addPlayer(
    tournamentId: string,
    playerId: string,
    seed?: number,
    rating?: number,
  ) {
    const tournament = await this.prisma.tournament.findUnique({
      where: { id: tournamentId },
    });

    if (!tournament) {
      throw new NotFoundException('Tournament not found');
    }

    if (!tournament.registrationOpen) {
      throw new BadRequestException('Registration is closed');
    }

    if (tournament.maxPlayers) {
      const count = await this.prisma.tournamentPlayer.count({
        where: { tournamentId },
      });

      if (count >= tournament.maxPlayers) {
        throw new BadRequestException('Tournament is full');
      }
    }

    const player = await this.prisma.tournamentPlayer.create({
      data: {
        tournamentId,
        playerId,
        seed: seed || 0,
        rating,
      },
      include: { player: true },
    });

    await this.webhookService.publish(WebhookEvents.PLAYER_REGISTERED, {
      tournamentId,
      playerId,
      name: `${player.player.firstName} ${player.player.lastName}`,
    });

    return player;
  }

  async removePlayer(tournamentId: string, playerId: string, userId: string) {
    await this.prisma.tournamentPlayer.deleteMany({
      where: { tournamentId, playerId },
    });

    await this.webhookService.publish(WebhookEvents.PLAYER_REMOVED, {
      tournamentId,
      playerId,
    });

    return { success: true };
  }

  async withdrawPlayer(
    tournamentId: string,
    playerId: string,
    roundNumber?: number,
  ) {
    await this.prisma.tournamentPlayer.update({
      where: {
        tournamentId_playerId: {
          tournamentId,
          playerId,
        },
      },
      data: {
        status: 'withdrawn',
        withdrawRound: roundNumber,
      },
    });

    await this.webhookService.publish(WebhookEvents.PLAYER_WITHDREW, {
      tournamentId,
      playerId,
      roundNumber,
    });

    return { success: true };
  }

  // Round management
  async createRound(tournamentId: string, roundNumber: number, name?: string) {
    try {
      const round = await this.prisma.round.create({
        data: {
          tournamentId,
          roundNumber,
          name,
          status: 'pending',
        },
      });

      await this.webhookService.publish(WebhookEvents.ROUND_CREATED, {
        tournamentId,
        roundId: round.id,
        roundNumber,
      });

      return round;
    } catch (err: any) {
      if (err.code === 'P2002') {
        const existing = await this.prisma.round.findUnique({
          where: {
            tournamentId_roundNumber: {
              tournamentId,
              roundNumber,
            },
          },
        });
        if (existing) return existing;
      }
      throw err;
    }
  }

  async publishRound(tournamentId: string, roundId: string) {
    const round = await this.prisma.round.update({
      where: { id: roundId },
      data: {
        status: 'published',
        publishedAt: new Date(),
      },
    });

    await this.webhookService.publish(WebhookEvents.ROUND_PUBLISHED, {
      tournamentId,
      roundId,
      roundNumber: round.roundNumber,
    });

    return round;
  }

  async completeRound(roundId: string) {
    const round = await this.prisma.round.update({
      where: { id: roundId },
      data: {
        status: 'completed',
        completedAt: new Date(),
      },
    });

    await this.webhookService.publish(WebhookEvents.ROUND_COMPLETED, {
      roundId,
      tournamentId: round.tournamentId,
      roundNumber: round.roundNumber,
    });

    return round;
  }

  // Pairing management
  async createPairing(
    roundId: string,
    whiteId: string,
    blackId: string,
    boardNumber?: number,
  ) {
    const pairing = await this.prisma.pairing.create({
      data: {
        roundId,
        whiteId,
        blackId,
        boardNumber,
        status: 'pending',
      },
      include: {
        white: true,
        black: true,
      },
    });

    await this.webhookService.publish(WebhookEvents.PAIRINGS_GENERATED, {
      roundId,
      pairingId: pairing.id,
      white: `${pairing.white.firstName} ${pairing.white.lastName}`,
      black: `${pairing.black.firstName} ${pairing.black.lastName}`,
    });

    return pairing;
  }

  async submitResult(pairingId: string, result: string) {
    // result: "1-0", "0-1", "1/2-1/2"
    let whiteScore: number;
    let blackScore: number;

    if (result === '1-0') {
      whiteScore = 1;
      blackScore = 0;
    } else if (result === '0-1') {
      whiteScore = 0;
      blackScore = 1;
    } else if (result === '1/2-1/2') {
      whiteScore = 0.5;
      blackScore = 0.5;
    } else {
      throw new BadRequestException('Invalid result format');
    }

    const pairing = await this.prisma.pairing.update({
      where: { id: pairingId },
      data: {
        result,
        whiteScore,
        blackScore,
        status: 'completed',
      },
      include: {
        round: true,
        white: true,
        black: true,
      },
    });

    // Create result records
    await this.prisma.result.create({
      data: {
        tournamentId: pairing.round.tournamentId,
        playerId: pairing.whiteId,
        tournamentPlayerId: (await this.prisma.tournamentPlayer.findFirst({
          where: {
            tournamentId: pairing.round.tournamentId,
            playerId: pairing.whiteId,
          },
        }))!.id,
        roundId: pairing.roundId,
        opponentId: pairing.blackId,
        color: 'W',
        result: whiteScore.toString(),
      },
    });

    await this.prisma.result.create({
      data: {
        tournamentId: pairing.round.tournamentId,
        playerId: pairing.blackId,
        tournamentPlayerId: (await this.prisma.tournamentPlayer.findFirst({
          where: {
            tournamentId: pairing.round.tournamentId,
            playerId: pairing.blackId,
          },
        }))!.id,
        roundId: pairing.roundId,
        opponentId: pairing.whiteId,
        color: 'B',
        result: blackScore.toString(),
      },
    });

    await this.webhookService.publish(WebhookEvents.MATCH_RESULT_SUBMITTED, {
      pairingId,
      roundId: pairing.roundId,
      result,
      white: `${pairing.white.firstName} ${pairing.white.lastName}`,
      black: `${pairing.black.firstName} ${pairing.black.lastName}`,
    });

    return pairing;
  }

  async getStandings(tournamentId: string) {
    const players = await this.prisma.tournamentPlayer.findMany({
      where: { tournamentId },
      include: {
        player: true,
        results: true,
      },
    });

    const standings = players.map((p: any) => ({
      rank: 0,
      playerId: p.playerId,
      name: `${p.player.firstName} ${p.player.lastName}`,
      seed: p.seed,
      rating: Number(p.rating),
      points: p.results.reduce(
        (sum: number, r: any) => sum + parseFloat(r.result),
        0,
      ),
      games: p.results.length,
      wins: 0,
      draws: 0,
      losses: 0,
      tiebreaks: {
        buchholz: 0,
        buchholzMedian: 0,
        sonnebornBerger: 0,
        directEncounter: undefined,
        progressScore: 0,
        averageOpponentRating: 0,
      },
      status: p.status,
    }));

    // Sort by points (desc), then by seed (asc)
    standings.sort((a: any, b: any) => {
      if (b.points !== a.points) return b.points - a.points;
      return a.seed - b.seed;
    });

    standings.forEach((s: any, i: number) => (s.rank = i + 1));

    return standings;
  }

  // Admin management
  async assignAdmin(tournamentId: string, playerId: string, userId: string) {
    const tournament = await this.prisma.tournament.findUnique({
      where: { id: tournamentId },
    });

    if (!tournament) {
      throw new NotFoundException('Tournament not found');
    }

    // Check if player exists in tournament
    const tournamentPlayer = await this.prisma.tournamentPlayer.findUnique({
      where: {
        tournamentId_playerId: {
          tournamentId,
          playerId,
        },
      },
    });

    if (!tournamentPlayer) {
      throw new NotFoundException('Player not found in tournament');
    }

    await this.prisma.tournamentPlayer.update({
      where: {
        tournamentId_playerId: {
          tournamentId,
          playerId,
        },
      },
      data: {
        isAdmin: true,
      },
    });

    await this.webhookService.publish(WebhookEvents.TOURNAMENT_ADMIN_ASSIGNED, {
      tournamentId,
      playerId,
      assignedBy: userId,
    });

    return { success: true };
  }

  async revokeAdmin(tournamentId: string, playerId: string, userId: string) {
    const tournamentPlayer = await this.prisma.tournamentPlayer.findUnique({
      where: {
        tournamentId_playerId: {
          tournamentId,
          playerId,
        },
      },
    });

    if (!tournamentPlayer) {
      throw new NotFoundException('Player not found in tournament');
    }

    await this.prisma.tournamentPlayer.update({
      where: {
        tournamentId_playerId: {
          tournamentId,
          playerId,
        },
      },
      data: {
        isAdmin: false,
      },
    });

    await this.webhookService.publish(WebhookEvents.TOURNAMENT_ADMIN_REVOKED, {
      tournamentId,
      playerId,
      revokedBy: userId,
    });

    return { success: true };
  }

  async getAdmins(tournamentId: string) {
    const admins = await this.prisma.tournamentPlayer.findMany({
      where: {
        tournamentId,
        isAdmin: true,
      },
      include: {
        player: true,
      },
    });

    return admins;
  }

  async isTournamentAdmin(
    tournamentId: string,
    playerId: string,
  ): Promise<boolean> {
    const tournamentPlayer = await this.prisma.tournamentPlayer.findUnique({
      where: {
        tournamentId_playerId: {
          tournamentId,
          playerId,
        },
      },
    });

    return tournamentPlayer?.isAdmin === true;
  }

  async isTournamentOwner(
    tournamentId: string,
    userId: string,
  ): Promise<boolean> {
    const tournament = await this.prisma.tournament.findUnique({
      where: { id: tournamentId },
    });

    return tournament?.ownerId === userId;
  }
}
