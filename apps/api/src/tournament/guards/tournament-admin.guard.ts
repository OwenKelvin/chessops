import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class TournamentAdminGuard implements CanActivate {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    const userId = user.userId || user.sub;

    const tournamentIdOrSlug = request.params.idOrSlug || request.params.id;

    if (!tournamentIdOrSlug) {
      throw new ForbiddenException('Tournament ID required');
    }

    let tournamentId = tournamentIdOrSlug;
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(tournamentIdOrSlug)) {
      const tournament = await this.prisma.tournament.findUnique({
        where: { slug: tournamentIdOrSlug },
        select: { id: true },
      });
      if (!tournament) {
        throw new ForbiddenException('Tournament not found');
      }
      tournamentId = tournament.id;
    }

    // Check if user is tournament owner
    const tournament = await this.prisma.tournament.findUnique({
      where: { id: tournamentId },
      select: { ownerId: true },
    });

    if (!tournament) {
      throw new ForbiddenException('Tournament not found');
    }

    if (tournament.ownerId === userId) {
      return true;
    }

    // Check if user is an admin of this tournament
    const tournamentPlayer = await this.prisma.tournamentPlayer.findFirst({
      where: {
        tournamentId,
        playerId: userId,
      },
      select: { isAdmin: true },
    });

    if (tournamentPlayer?.isAdmin) {
      return true;
    }

    throw new ForbiddenException('Tournament admin access required');
  }
}
