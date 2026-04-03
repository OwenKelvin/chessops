import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { createHash, randomBytes } from 'crypto';

@Injectable()
export class ApiKeyService {
  constructor(private prisma: PrismaService) {}

  /**
   * Generate a new API key for a user
   * Returns the raw key (to show user once) and stores only the hash
   */
  async generateApiKey(userId: string, name: string, permissions: string[] = [], expiresAt?: Date) {
    // Generate a random key (prefix + random part)
    const prefix = 'sk_live_';
    const randomPart = randomBytes(24).toString('hex');
    const rawKey = `${prefix}${randomPart}`;

    // Hash the key for storage
    const keyHash = this.hashKey(rawKey);

    // Store in database
    const apiKey = await this.prisma.apiKey.create({
      data: {
        userId,
        name,
        keyHash,
        prefix: rawKey.substring(0, 12), // Store first 12 chars for identification
        permissions: JSON.stringify(permissions),
        expiresAt,
      },
      select: {
        id: true,
        name: true,
        prefix: true,
        permissions: true,
        expiresAt: true,
        createdAt: true,
      },
    });

    return {
      ...apiKey,
      key: rawKey, // Return raw key ONCE - user should save it
    };
  }

  /**
   * Validate an API key and return the user info if valid
   */
  async validateApiKey(key: string) {
    const keyHash = this.hashKey(key);

    const apiKey = await this.prisma.apiKey.findUnique({
      where: { keyHash },
      include: { user: true },
    });

    if (!apiKey) {
      return null;
    }

    // Check if expired
    if (apiKey.expiresAt && new Date() > apiKey.expiresAt) {
      throw new BadRequestException('API key has expired');
    }

    // Update last used timestamp
    await this.prisma.apiKey.update({
      where: { id: apiKey.id },
      data: { lastUsedAt: new Date() },
    });

    return {
      userId: apiKey.userId,
      permissions: JSON.parse(apiKey.permissions) as string[],
      keyId: apiKey.id,
    };
  }

  /**
   * List all API keys for a user
   */
  async listApiKeys(userId: string) {
    return this.prisma.apiKey.findMany({
      where: { userId },
      select: {
        id: true,
        name: true,
        prefix: true,
        permissions: true,
        expiresAt: true,
        lastUsedAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get a specific API key by ID
   */
  async getApiKey(userId: string, keyId: string) {
    const apiKey = await this.prisma.apiKey.findFirst({
      where: { id: keyId, userId },
      select: {
        id: true,
        name: true,
        prefix: true,
        permissions: true,
        expiresAt: true,
        lastUsedAt: true,
        createdAt: true,
      },
    });

    if (!apiKey) {
      throw new NotFoundException('API key not found');
    }

    return apiKey;
  }

  /**
   * Update an API key
   */
  async updateApiKey(userId: string, keyId: string, data: { name?: string; permissions?: string[]; expiresAt?: Date }) {
    return this.prisma.apiKey.update({
      where: { id: keyId, userId },
      data: {
        name: data.name,
        permissions: data.permissions ? JSON.stringify(data.permissions) : undefined,
        expiresAt: data.expiresAt,
      },
      select: {
        id: true,
        name: true,
        prefix: true,
        permissions: true,
        expiresAt: true,
        updatedAt: true,
      },
    });
  }

  /**
   * Revoke (delete) an API key
   */
  async revokeApiKey(userId: string, keyId: string) {
    await this.prisma.apiKey.deleteMany({
      where: { id: keyId, userId },
    });
  }

  /**
   * Rotate an API key - invalidate old key and create new one
   */
  async rotateApiKey(userId: string, keyId: string, name?: string) {
    const oldKey = await this.prisma.apiKey.findFirst({
      where: { id: keyId, userId },
    });

    if (!oldKey) {
      throw new NotFoundException('API key not found');
    }

    // Delete old key
    await this.prisma.apiKey.delete({
      where: { id: keyId },
    });

    // Generate new key
    const prefix = 'sk_live_';
    const randomPart = randomBytes(24).toString('hex');
    const rawKey = `${prefix}${randomPart}`;
    const keyHash = this.hashKey(rawKey);

    const newKey = await this.prisma.apiKey.create({
      data: {
        userId,
        name: name || oldKey.name,
        keyHash,
        prefix: rawKey.substring(0, 12),
        permissions: oldKey.permissions,
        expiresAt: oldKey.expiresAt,
      },
      select: {
        id: true,
        name: true,
        prefix: true,
        permissions: true,
        expiresAt: true,
        createdAt: true,
      },
    });

    return {
      ...newKey,
      key: rawKey,
    };
  }

  private hashKey(key: string): string {
    return createHash('sha256').update(key).digest('hex');
  }
}
