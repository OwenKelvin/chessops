import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import * as bcrypt from 'bcryptjs';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { randomBytes } from 'crypto';

interface OAuthProfile {
  provider: string;
  providerId: string;
  email?: string;
  displayName?: string;
  avatarUrl?: string;
  accessToken: string;
  refreshToken?: string;
}

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private mailService: MailService,
  ) {}

  async register(dto: RegisterDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        displayName: dto.displayName,
      },
    });

    const tokens = await this.generateTokens(user.id);

    await this.storeRefreshToken(user.id, tokens.refreshToken);

    return {
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
      },
      ...tokens,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.isSuspended) {
      throw new UnauthorizedException('Account suspended');
    }

    const passwordMatches = await bcrypt.compare(dto.password, user.passwordHash);

    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = await this.generateTokens(user.id);

    await this.storeRefreshToken(user.id, tokens.refreshToken);

    return {
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        role: user.role,
      },
      ...tokens,
    };
  }

  async logout(refreshToken: string) {
    await this.prisma.session.deleteMany({
      where: { token: refreshToken },
    });
  }

  async refreshTokens(refreshToken: string) {
    const session = await this.prisma.session.findUnique({
      where: { token: refreshToken },
    });

    if (!session) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (new Date() > session.expiresAt) {
      await this.prisma.session.delete({ where: { id: session.id } });
      throw new UnauthorizedException('Refresh token expired');
    }

    const tokens = await this.generateTokens(session.userId);

    await this.prisma.session.update({
      where: { id: session.id },
      data: {
        token: tokens.refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    return tokens;
  }

  async revokeRefreshToken(userId: string, refreshToken: string) {
    await this.prisma.session.deleteMany({
      where: {
        userId,
        token: refreshToken,
      },
    });
  }

  async revokeAllSessions(userId: string) {
    await this.prisma.session.deleteMany({
      where: { userId },
    });
  }

  private async generateTokens(userId: string) {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        { sub: userId },
        { expiresIn: '15m' },
      ),
      this.jwtService.signAsync(
        { sub: userId },
        { expiresIn: '7d' },
      ),
    ]);

    return { accessToken, refreshToken };
  }

  private async storeRefreshToken(userId: string, token: string) {
    await this.prisma.session.create({
      data: {
        userId,
        token,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });
  }

  async validateOAuthUser(profile: OAuthProfile) {
    // Check if OAuth account already exists
    const existingOAuth = await this.prisma.oauthAccount.findUnique({
      where: {
        provider_providerAccountId: {
          provider: profile.provider,
          providerAccountId: profile.providerId,
        },
      },
      include: { user: true },
    });

    if (existingOAuth) {
      // Update tokens
      await this.prisma.oauthAccount.update({
        where: { id: existingOAuth.id },
        data: {
          accessToken: profile.accessToken,
          refreshToken: profile.refreshToken || existingOAuth.refreshToken,
        },
      });

      const tokens = await this.generateTokens(existingOAuth.userId);
      await this.storeRefreshToken(existingOAuth.userId, tokens.refreshToken);

      return {
        user: {
          id: existingOAuth.user.id,
          email: existingOAuth.user.email,
          displayName: existingOAuth.user.displayName,
          avatarUrl: existingOAuth.user.avatarUrl,
        },
        ...tokens,
      };
    }

    // Check if user with this email exists
    if (profile.email) {
      const existingUser = await this.prisma.user.findUnique({
        where: { email: profile.email },
      });

      if (existingUser) {
        // Link OAuth account to existing user
        await this.prisma.oauthAccount.create({
          data: {
            userId: existingUser.id,
            provider: profile.provider,
            providerAccountId: profile.providerId,
            accessToken: profile.accessToken,
            refreshToken: profile.refreshToken,
          },
        });

        const tokens = await this.generateTokens(existingUser.id);
        await this.storeRefreshToken(existingUser.id, tokens.refreshToken);

        return {
          user: {
            id: existingUser.id,
            email: existingUser.email,
            displayName: existingUser.displayName,
            avatarUrl: existingUser.avatarUrl,
          },
          ...tokens,
        };
      }
    }

    // Create new user
    const user = await this.prisma.user.create({
      data: {
        email: profile.email || `${profile.providerId}@${profile.provider}.local`,
        displayName: profile.displayName || profile.providerId,
        avatarUrl: profile.avatarUrl,
        emailVerifiedAt: profile.email ? new Date() : undefined,
      },
    });

    await this.prisma.oauthAccount.create({
      data: {
        userId: user.id,
        provider: profile.provider,
        providerAccountId: profile.providerId,
        accessToken: profile.accessToken,
        refreshToken: profile.refreshToken,
      },
    });

    const tokens = await this.generateTokens(user.id);
    await this.storeRefreshToken(user.id, tokens.refreshToken);

    return {
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
      },
      ...tokens,
    };
  }

  async getUserById(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        displayName: true,
        avatarUrl: true,
      },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    return user;
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.passwordHash) {
      throw new BadRequestException('User not found');
    }

    const passwordMatches = await bcrypt.compare(currentPassword, user.passwordHash);

    if (!passwordMatches) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    // Revoke all sessions
    await this.revokeAllSessions(userId);
  }

  async updateProfile(userId: string, dto: { displayName?: string; avatarUrl?: string }) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        displayName: dto.displayName,
        avatarUrl: dto.avatarUrl,
      },
      select: {
        id: true,
        email: true,
        displayName: true,
        avatarUrl: true,
      },
    });
  }

  async deleteAccount(userId: string) {
    // Delete all sessions first
    await this.prisma.session.deleteMany({
      where: { userId },
    });

    // Delete OAuth accounts
    await this.prisma.oauthAccount.deleteMany({
      where: { userId },
    });

    // Delete MFA secrets
    await this.prisma.mfaSecret.deleteMany({
      where: { userId },
    });

    // Delete account recovery tokens
    await this.prisma.accountRecovery.deleteMany({
      where: { userId },
    });

    // Finally delete the user
    await this.prisma.user.delete({
      where: { id: userId },
    });
  }

  async requestEmailVerification(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.emailVerifiedAt) {
      throw new BadRequestException('Email already verified');
    }

    // Delete existing verification token if any
    await this.prisma.emailVerification.deleteMany({
      where: { userId: user.id },
    });

    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await this.prisma.emailVerification.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
      },
    });

    // Send verification email
    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:4200'}/verify-email?token=${token}`;
    await this.mailService.sendMail(
      email,
      'Verify your email - ChessOps',
      `<p>Click <a href="${verificationUrl}">here</a> to verify your email.</p>`,
    );

    return { success: true };
  }

  async verifyEmail(token: string) {
    const verification = await this.prisma.emailVerification.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!verification) {
      throw new BadRequestException('Invalid verification token');
    }

    if (verification.used) {
      throw new BadRequestException('Token already used');
    }

    if (new Date() > verification.expiresAt) {
      throw new BadRequestException('Verification token expired');
    }

    await this.prisma.user.update({
      where: { id: verification.userId },
      data: { emailVerifiedAt: new Date() },
    });

    await this.prisma.emailVerification.update({
      where: { id: verification.id },
      data: { used: true },
    });

    return { success: true };
  }
}
