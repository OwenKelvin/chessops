import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WebhookService } from '../webhook/webhook.service';
import { WebhookEvents } from '../webhook/webhook.events';

@Injectable()
export class PlayerService {
  constructor(
    private prisma: PrismaService,
    private webhookService: WebhookService,
  ) {}

  async create(userId: string, data: any) {
    const player = await this.prisma.player.create({
      data: {
        ownerId: userId,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        fideId: data.fideId,
        nationalId: data.nationalId,
        rating: data.rating || 0,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
        gender: data.gender,
      },
    });

    await this.webhookService.publish(WebhookEvents.PLAYER_ADDED, {
      playerId: player.id,
      name: `${player.firstName} ${player.lastName}`,
      ownerId: userId,
    });

    return player;
  }

  async findAll(userId: string, filters?: { search?: string; rating?: number }) {
    const where: any = { ownerId: userId };

    if (filters?.search) {
      where.OR = [
        { firstName: { contains: filters.search, mode: 'insensitive' } },
        { lastName: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
        { fideId: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.player.findMany({
      where,
      include: {
        tournaments: {
          include: {
            tournament: {
              select: {
                id: true,
                name: true,
                status: true,
              },
            },
          },
        },
        _count: {
          select: { tournaments: true },
        },
      },
      orderBy: { lastName: 'asc' },
    });
  }

  async findOne(id: string, ownerId?: string) {
    const where: any = { id };
    if (ownerId) {
      where.ownerId = ownerId;
    }

    const player = await this.prisma.player.findUnique({
      where,
      include: {
        tournaments: {
          include: {
            tournament: {
              select: {
                id: true,
                name: true,
                status: true,
                startDate: true,
              },
            },
          },
          orderBy: {
            tournament: {
              startDate: 'desc',
            },
          },
        },
        pairingsWhite: {
          take: 10,
          include: {
            round: {
              include: {
                tournament: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
            black: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        pairingsBlack: {
          take: 10,
          include: {
            round: {
              include: {
                tournament: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
            white: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!player) {
      throw new NotFoundException('Player not found');
    }

    return player;
  }

  async update(id: string, userId: string, data: any) {
    const player = await this.prisma.player.findFirst({
      where: { id, ownerId: userId },
    });

    if (!player) {
      throw new NotFoundException('Player not found');
    }

    const updateData: any = {};
    if (data.firstName !== undefined) updateData.firstName = data.firstName;
    if (data.lastName !== undefined) updateData.lastName = data.lastName;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.fideId !== undefined) updateData.fideId = data.fideId;
    if (data.nationalId !== undefined) updateData.nationalId = data.nationalId;
    if (data.rating !== undefined) updateData.rating = data.rating;
    if (data.dateOfBirth !== undefined) updateData.dateOfBirth = new Date(data.dateOfBirth);
    if (data.gender !== undefined) updateData.gender = data.gender;

    const updated = await this.prisma.player.update({
      where: { id },
      data: updateData,
    });

    await this.webhookService.publish(WebhookEvents.PLAYER_REMOVED, {
      playerId: id,
      name: `${updated.firstName} ${updated.lastName}`,
    });

    return updated;
  }

  async delete(id: string, userId: string) {
    const player = await this.prisma.player.findFirst({
      where: { id, ownerId: userId },
    });

    if (!player) {
      throw new NotFoundException('Player not found');
    }

    // Check if player is registered in any active tournaments
    const activeTournaments = await this.prisma.tournamentPlayer.findFirst({
      where: {
        playerId: id,
        tournament: {
          status: {
            in: ['registration', 'active'],
          },
        },
      },
    });

    if (activeTournaments) {
      throw new BadRequestException(
        'Cannot delete player registered in an active tournament',
      );
    }

    await this.prisma.player.delete({
      where: { id },
    });

    await this.webhookService.publish(WebhookEvents.PLAYER_REMOVED, {
      playerId: id,
      name: `${player.firstName} ${player.lastName}`,
    });

    return { success: true };
  }

  async getStatistics(playerId: string) {
    const player = await this.prisma.player.findUnique({
      where: { id: playerId },
      include: {
        tournaments: {
          include: {
            tournament: true,
            results: true,
          },
        },
      },
    });

    if (!player) {
      throw new NotFoundException('Player not found');
    }

    let totalGames = 0;
    let wins = 0;
    let draws = 0;
    let losses = 0;

    for (const tp of player.tournaments) {
      for (const result of tp.results) {
        totalGames++;
        const score = parseFloat(result.result);
        if (score === 1) wins++;
        else if (score === 0.5) draws++;
        else losses++;
      }
    }

    const winRate = totalGames > 0 ? (wins / totalGames) * 100 : 0;
    const drawRate = totalGames > 0 ? (draws / totalGames) * 100 : 0;
    const lossRate = totalGames > 0 ? (losses / totalGames) * 100 : 0;
    const totalPoints = wins + (draws * 0.5);
    const averageScore = totalGames > 0 ? totalPoints / totalGames : 0;

    return {
      playerId: player.id,
      name: `${player.firstName} ${player.lastName}`,
      rating: player.rating,
      totalGames,
      wins,
      draws,
      losses,
      winRate: Math.round(winRate * 100) / 100,
      drawRate: Math.round(drawRate * 100) / 100,
      lossRate: Math.round(lossRate * 100) / 100,
      totalPoints,
      averageScore: Math.round(averageScore * 1000) / 1000,
      tournamentsPlayed: player.tournaments.length,
    };
  }
}
