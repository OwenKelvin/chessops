import { Controller, Get, Patch, Post, Body, Param, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';

class SuspendUserDto {
  suspended!: boolean;
  reason?: string;
}

class ImpersonateDto {
  expiresIn?: number; // seconds, default 1 hour
}

@Controller('admin')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminController {
  constructor(private prisma: PrismaService) {}

  @Get('users')
  async getUsers() {
    const users = await this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        displayName: true,
        avatarUrl: true,
        emailVerifiedAt: true,
        isSuspended: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return { users };
  }

  @Patch('users/:id/suspend')
  @HttpCode(HttpStatus.OK)
  async suspendUser(@Param('id') id: string, @Body() dto: SuspendUserDto) {
    const user = await this.prisma.user.update({
      where: { id },
      data: {
        isSuspended: dto.suspended,
      },
      select: {
        id: true,
        email: true,
        displayName: true,
        isSuspended: true,
      },
    });
    return { user };
  }

  @Post('users/:id/impersonate')
  @HttpCode(HttpStatus.OK)
  async impersonate(@Param('id') id: string, @Body() dto: ImpersonateDto) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const expiresIn = dto.expiresIn || 3600;
    const expiresInStr = expiresIn < 60 ? `${expiresIn}s` : `${Math.floor(expiresIn / 60)}m`;

    const jwtService = new JwtService();
    const accessToken = await jwtService.signAsync(
      { sub: user.id, impersonating: true },
      { expiresIn: expiresInStr } as any,
    );

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
      },
    };
  }
}
