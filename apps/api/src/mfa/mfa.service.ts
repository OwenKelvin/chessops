import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';

@Injectable()
export class MfaService {
  constructor(private prisma: PrismaService) {}

  async generateMfaSecret(userId: string) {
    const secret = speakeasy.generateSecret({
      name: `ChessOps (${userId})`,
      length: 32,
    });

    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url!);

    return {
      secret: secret.base32,
      qrCodeUrl,
      otpAuthUrl: secret.otpauth_url,
    };
  }

  async enableMfa(userId: string, secret: string, token: string) {
    const verified = speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
    });

    if (!verified) {
      throw new BadRequestException('Invalid TOTP token');
    }

    const backupCodes = this.generateBackupCodes();

    await this.prisma.mfaSecret.upsert({
      where: { userId },
      update: {
        secret,
        backupCodes: JSON.stringify(backupCodes),
        enabled: true,
      },
      create: {
        userId,
        secret,
        backupCodes: JSON.stringify(backupCodes),
        enabled: true,
      },
    });

    return { backupCodes };
  }

  async verifyMfaToken(userId: string, token: string): Promise<boolean> {
    const mfaSecret = await this.prisma.mfaSecret.findUnique({
      where: { userId },
    });

    if (!mfaSecret || !mfaSecret.enabled) {
      return true; // MFA not enabled, allow
    }

    return speakeasy.totp.verify({
      secret: mfaSecret.secret,
      encoding: 'base32',
      token,
    });
  }

  async disableMfa(userId: string, token: string) {
    const mfaSecret = await this.prisma.mfaSecret.findUnique({
      where: { userId },
    });

    if (!mfaSecret) {
      throw new BadRequestException('MFA not enabled');
    }

    const verified = speakeasy.totp.verify({
      secret: mfaSecret.secret,
      encoding: 'base32',
      token,
    });

    if (!verified) {
      throw new BadRequestException('Invalid TOTP token');
    }

    await this.prisma.mfaSecret.update({
      where: { userId },
      data: { enabled: false },
    });
  }

  async verifyBackupCode(userId: string, code: string): Promise<boolean> {
    const mfaSecret = await this.prisma.mfaSecret.findUnique({
      where: { userId },
    });

    if (!mfaSecret || !mfaSecret.enabled) {
      return false;
    }

    const backupCodes = JSON.parse(mfaSecret.backupCodes) as string[];
    const index = backupCodes.findIndex((c) => c === code);

    if (index === -1) {
      return false;
    }

    // Remove used backup code
    backupCodes.splice(index, 1);
    await this.prisma.mfaSecret.update({
      where: { userId },
      data: { backupCodes: JSON.stringify(backupCodes) },
    });

    return true;
  }

  async isMfaEnabled(userId: string): Promise<boolean> {
    const mfaSecret = await this.prisma.mfaSecret.findUnique({
      where: { userId },
    });

    return mfaSecret?.enabled ?? false;
  }

  private generateBackupCodes(): string[] {
    const codes: string[] = [];
    for (let i = 0; i < 10; i++) {
      codes.push(Math.random().toString(36).substring(2, 10).toUpperCase());
    }
    return codes;
  }
}
