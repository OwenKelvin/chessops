import { vi, beforeEach, describe, it, expect } from 'vitest';

vi.mock('bcryptjs', () => ({
  hash: vi.fn().mockResolvedValue('hashed-password'),
  compare: vi.fn().mockImplementation((input, hash) => Promise.resolve(input === 'password123')),
}));

vi.mock('@prisma/client', () => ({
  PrismaClient: vi.fn().mockImplementation(() => ({})),
}));

import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { MailService } from '../mail/mail.service';
import { UnauthorizedException, BadRequestException } from '@nestjs/common';

const createMockPrismaService = () => ({
  user: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
  session: { deleteMany: vi.fn(), findUnique: vi.fn(), update: vi.fn(), create: vi.fn() },
  oauthAccount: { findUnique: vi.fn(), update: vi.fn(), create: vi.fn(), deleteMany: vi.fn() },
  emailVerification: { deleteMany: vi.fn(), create: vi.fn(), findUnique: vi.fn(), update: vi.fn() },
  mfaSecret: { deleteMany: vi.fn() },
  accountRecovery: { deleteMany: vi.fn() },
  player: { findUnique: vi.fn() },
});

const createMockJwtService = () => ({ signAsync: vi.fn() });
const createMockMailService = () => ({ sendMail: vi.fn() });

describe('AuthController', () => {
  let authController: AuthController;
  let prismaService: PrismaService;
  let mockPrisma: ReturnType<typeof createMockPrismaService>;
  let mockJwt: ReturnType<typeof createMockJwtService>;
  let mockMail: ReturnType<typeof createMockMailService>;

  beforeEach(async () => {
    mockPrisma = createMockPrismaService();
    mockJwt = createMockJwtService();
    mockMail = createMockMailService();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JwtService, useValue: mockJwt },
        { provide: MailService, useValue: mockMail },
      ],
    }).compile();

    authController = module.get<AuthController>(AuthController);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  describe('POST /auth/register', () => {
    it('should register user and return tokens', async () => {
      const dto = { email: 'test@example.com', password: 'password123' };
      const mockUser = { id: '1', email: dto.email, displayName: null, avatarUrl: null, passwordHash: 'hash' };

      mockPrisma.user.findUnique.mockResolvedValueOnce(null); // Check if email exists
      mockPrisma.user.create.mockResolvedValue(mockUser);
      mockJwt.signAsync.mockResolvedValueOnce('access-token').mockResolvedValueOnce('refresh-token');
      mockPrisma.session.create.mockResolvedValue({});
      mockPrisma.player.findUnique.mockResolvedValue({ id: '1', userId: '1' });
      mockPrisma.user.findUnique.mockResolvedValueOnce(mockUser); // For requestEmailVerification
      mockMail.sendMail.mockResolvedValue({});

      const result = await authController.register(dto);

      expect(result).toHaveProperty('accessToken');
    });

    it('should throw ConflictException if email exists', async () => {
      const dto = { email: 'existing@example.com', password: 'password123' };
      mockPrisma.user.findUnique.mockResolvedValue({ id: '1', email: dto.email });

      await expect(authController.register(dto)).rejects.toThrow('Email already registered');
    });
  });

  describe('POST /auth/login', () => {
    it('should login and return tokens', async () => {
      const dto = { email: 'test@example.com', password: 'password123' };
      const mockUser = { id: '1', email: dto.email, displayName: 'Test', avatarUrl: null, passwordHash: 'hash', role: 'user', isSuspended: false };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockJwt.signAsync.mockResolvedValueOnce('access-token').mockResolvedValueOnce('refresh-token');
      mockPrisma.session.create.mockResolvedValue({});

      const result = await authController.login(dto);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
    });

    it('should throw UnauthorizedException for invalid credentials', async () => {
      const dto = { email: 'test@example.com', password: 'wrong' };
      mockPrisma.user.findUnique.mockResolvedValue({ id: '1', email: dto.email, passwordHash: 'different' });

      await expect(authController.login(dto)).rejects.toThrow('Invalid credentials');
    });
  });

  describe('GET /auth/me', () => {
    it('should return current user', async () => {
      const req = { user: { userId: '1' } };
      const mockUser = { id: '1', email: 'test@example.com', displayName: 'Test', avatarUrl: null };
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await authController.getMe(req);

      expect(result).toEqual(mockUser);
    });

    it('should throw BadRequestException if user not found', async () => {
      const req = { user: { userId: '999' } };
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(authController.getMe(req)).rejects.toThrow('User not found');
    });
  });

  describe('PATCH /auth/me', () => {
    it('should update profile', async () => {
      const req = { user: { userId: '1' } };
      const dto = { displayName: 'New Name' };
      const mockUser = { id: '1', email: 'test@example.com', displayName: 'New Name', avatarUrl: null };
      mockPrisma.user.update.mockResolvedValue(mockUser);

      const result = await authController.updateProfile(req, dto);

      expect(result).toEqual(mockUser);
    });
  });

  describe('DELETE /auth/me', () => {
    it('should delete account', async () => {
      const req = { user: { userId: '1' } };
      mockPrisma.session.deleteMany.mockResolvedValue({});
      mockPrisma.oauthAccount.deleteMany.mockResolvedValue({});
      mockPrisma.mfaSecret.deleteMany.mockResolvedValue({});
      mockPrisma.accountRecovery.deleteMany.mockResolvedValue({});
      mockPrisma.user.delete.mockResolvedValue({});

      const result = await authController.deleteAccount(req);

      expect(result).toEqual({ success: true });
    });
  });

  describe('POST /auth/token/refresh', () => {
    it('should refresh token', async () => {
      const dto = { refreshToken: 'valid-token' };
      const mockSession = { id: '1', userId: '1', token: dto.refreshToken, expiresAt: new Date(Date.now() + 86400000) };
      mockPrisma.session.findUnique.mockResolvedValue(mockSession);
      mockJwt.signAsync.mockResolvedValueOnce('new-access').mockResolvedValueOnce('new-refresh');
      mockPrisma.session.update.mockResolvedValue({});

      const result = await authController.refreshToken(dto);

      expect(result).toHaveProperty('accessToken');
    });

    it('should throw for invalid refresh token', async () => {
      const dto = { refreshToken: 'invalid' };
      mockPrisma.session.findUnique.mockResolvedValue(null);

      await expect(authController.refreshToken(dto)).rejects.toThrow('Invalid refresh token');
    });
  });

  describe('POST /auth/logout', () => {
    it('should delete session', async () => {
      const dto = { refreshToken: 'token' };
      mockPrisma.session.deleteMany.mockResolvedValue({});

      await authController.logout(dto);

      expect(prismaService.session.deleteMany).toHaveBeenCalled();
    });
  });
});
