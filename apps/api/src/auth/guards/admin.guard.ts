import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    // Get user from JwtAuthGuard (already validated)
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    const userId = user.userId || user.sub;

    // Fetch fresh user data to check role and suspension status
    const dbUser = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, isSuspended: true },
    });

    if (!dbUser) {
      throw new ForbiddenException('User not found');
    }

    if (dbUser.isSuspended) {
      throw new ForbiddenException('Account suspended');
    }

    if (dbUser.role !== 'admin') {
      throw new ForbiddenException('Admin access required');
    }

    return true;
  }
}
