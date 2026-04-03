import { Injectable, NotFoundException, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { randomBytes } from 'crypto';

@Injectable()
export class AppRegistrationService {
  constructor(private prisma: PrismaService) {}

  /**
   * Generate OAuth client credentials
   */
  private generateCredentials() {
    const clientId = `client_${randomBytes(16).toString('hex')}`;
    const clientSecret = `secret_${randomBytes(32).toString('hex')}`;
    return { clientId, clientSecret };
  }

  /**
   * Create a new application
   */
  async createApp(userId: string, data: {
    name: string;
    description?: string;
    callbackUrls?: string[];
    redirectUris?: string[];
    webhookUrl?: string;
  }) {
    const { clientId, clientSecret } = this.generateCredentials();

    const app = await this.prisma.app.create({
      data: {
        userId,
        name: data.name,
        description: data.description,
        callbackUrls: JSON.stringify(data.callbackUrls || []),
        redirectUris: JSON.stringify(data.redirectUris || []),
        clientId,
        clientSecret,
        webhookUrl: data.webhookUrl,
      },
      select: {
        id: true,
        name: true,
        description: true,
        callbackUrls: true,
        redirectUris: true,
        clientId: true,
        webhookUrl: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return {
      ...app,
      clientSecret, // Return secret only once
    };
  }

  /**
   * List all apps for a user
   */
  async listApps(userId: string) {
    return this.prisma.app.findMany({
      where: { userId },
      select: {
        id: true,
        name: true,
        description: true,
        clientId: true,
        isActive: true,
        webhookUrl: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get a specific app by ID
   */
  async getApp(userId: string, appId: string) {
    const app = await this.prisma.app.findFirst({
      where: { id: appId, userId },
      select: {
        id: true,
        name: true,
        description: true,
        callbackUrls: true,
        redirectUris: true,
        clientId: true,
        isActive: true,
        webhookUrl: true,
        webhookSecret: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!app) {
      throw new NotFoundException('App not found');
    }

    return app;
  }

  /**
   * Get app by client ID (for OAuth flow)
   */
  async getAppByClientId(clientId: string) {
    const app = await this.prisma.app.findUnique({
      where: { clientId },
      include: { user: true },
    });

    if (!app || !app.isActive) {
      return null;
    }

    return app;
  }

  /**
   * Validate client secret
   */
  async validateClientSecret(clientId: string, clientSecret: string) {
    const app = await this.prisma.app.findUnique({
      where: { clientId },
    });

    if (!app || !app.isActive) {
      throw new UnauthorizedException('Invalid client credentials');
    }

    if (app.clientSecret !== clientSecret) {
      throw new UnauthorizedException('Invalid client secret');
    }

    return app;
  }

  /**
   * Update an app
   */
  async updateApp(userId: string, appId: string, data: {
    name?: string;
    description?: string;
    callbackUrls?: string[];
    redirectUris?: string[];
    webhookUrl?: string;
    isActive?: boolean;
  }) {
    const app = await this.prisma.app.findFirst({
      where: { id: appId, userId },
    });

    if (!app) {
      throw new NotFoundException('App not found');
    }

    const updateData: Record<string, unknown> = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.callbackUrls !== undefined) updateData.callbackUrls = JSON.stringify(data.callbackUrls);
    if (data.redirectUris !== undefined) updateData.redirectUris = JSON.stringify(data.redirectUris);
    if (data.webhookUrl !== undefined) updateData.webhookUrl = data.webhookUrl;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    return this.prisma.app.update({
      where: { id: appId },
      data: updateData,
      select: {
        id: true,
        name: true,
        description: true,
        clientId: true,
        isActive: true,
        webhookUrl: true,
        updatedAt: true,
      },
    });
  }

  /**
   * Regenerate client secret
   */
  async regenerateSecret(userId: string, appId: string, currentSecret: string) {
    const app = await this.prisma.app.findFirst({
      where: { id: appId, userId },
    });

    if (!app) {
      throw new NotFoundException('App not found');
    }

    // Verify current secret
    if (app.clientSecret !== currentSecret) {
      throw new UnauthorizedException('Current secret is incorrect');
    }

    const { clientSecret } = this.generateCredentials();

    await this.prisma.app.update({
      where: { id: appId },
      data: { clientSecret },
    });

    return { clientSecret };
  }

  /**
   * Regenerate webhook secret
   */
  async regenerateWebhookSecret(userId: string, appId: string) {
    const app = await this.prisma.app.findFirst({
      where: { id: appId, userId },
    });

    if (!app) {
      throw new NotFoundException('App not found');
    }

    const webhookSecret = `whsec_${randomBytes(24).toString('hex')}`;

    await this.prisma.app.update({
      where: { id: appId },
      data: { webhookSecret },
    });

    return { webhookSecret };
  }

  /**
   * Delete an app
   */
  async deleteApp(userId: string, appId: string) {
    const app = await this.prisma.app.findFirst({
      where: { id: appId, userId },
    });

    if (!app) {
      throw new NotFoundException('App not found');
    }

    await this.prisma.app.delete({
      where: { id: appId },
    });

    return { success: true };
  }
}
