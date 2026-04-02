import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import * as crypto from 'crypto';

@Injectable()
export class AuthRecoveryService {
  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
  ) {}

  async requestPasswordReset(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Don't reveal if email exists
      return { message: 'If the email exists, a reset link has been sent' };
    }

    // Invalidate existing recovery tokens
    await this.prisma.accountRecovery.updateMany({
      where: { userId: user.id, used: false },
      data: { used: true },
    });

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await this.prisma.accountRecovery.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
        used: false,
      },
    });

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

    await this.mailService.sendMail(email, 'Password Reset Request', `
      <p>You requested a password reset.</p>
      <p>Click the link below to reset your password:</p>
      <a href="${resetUrl}">${resetUrl}</a>
      <p>This link expires in 1 hour.</p>
      <p>If you didn't request this, ignore this email.</p>
    `);

    return { message: 'If the email exists, a reset link has been sent' };
  }

  async resetPassword(token: string, newPassword: string) {
    const recovery = await this.prisma.accountRecovery.findUnique({
      where: { token },
    });

    if (!recovery || recovery.used) {
      throw new BadRequestException('Invalid or expired token');
    }

    if (new Date() > recovery.expiresAt) {
      throw new BadRequestException('Token expired');
    }

    const passwordHash = await this.hashPassword(newPassword);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: recovery.userId },
        data: { passwordHash },
      }),
      this.prisma.accountRecovery.update({
        where: { id: recovery.id },
        data: { used: true },
      }),
      this.prisma.session.deleteMany({
        where: { userId: recovery.userId },
      }),
    ]);

    return { message: 'Password reset successfully' };
  }

  private async hashPassword(password: string): Promise<string> {
    const bcrypt = await import('bcryptjs');
    return bcrypt.hash(password, 10);
  }
}
