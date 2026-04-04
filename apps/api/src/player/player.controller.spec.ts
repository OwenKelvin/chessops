import { vi, beforeEach, describe, it, expect } from 'vitest';

vi.mock('@prisma/client', () => ({
  PrismaClient: vi.fn().mockImplementation(() => ({})),
}));

import { Test, TestingModule } from '@nestjs/testing';
import { PlayerController } from './player.controller';
import { PlayerService } from './player.service';
import { PrismaService } from '../prisma/prisma.service';
import { WebhookService } from '../webhook/webhook.service';

const createMockPrismaService = () => ({
  player: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn(), findMany: vi.fn(), findFirst: vi.fn() },
  tournamentPlayer: { findMany: vi.fn(), findFirst: vi.fn() },
  pairing: { findMany: vi.fn() },
});

const createMockWebhookService = () => ({ publish: vi.fn() });

describe('PlayerController', () => {
  let controller: PlayerController;
  let prismaService: PrismaService;
  let mockPrisma: ReturnType<typeof createMockPrismaService>;
  let mockWebhook: ReturnType<typeof createMockWebhookService>;

  beforeEach(async () => {
    mockPrisma = createMockPrismaService();
    mockWebhook = createMockWebhookService();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PlayerController],
      providers: [
        PlayerService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: WebhookService, useValue: mockWebhook },
      ],
    }).compile();

    controller = module.get<PlayerController>(PlayerController);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  describe('POST /players', () => {
    it('should create a player', async () => {
      const req = { user: { userId: '1' } };
      const dto = { displayName: 'John' };
      const mock = { id: 'p1', displayName: dto.displayName };
      mockPrisma.player.create.mockResolvedValue(mock);
      mockWebhook.publish.mockResolvedValue(undefined);

      const result = await controller.create(req, dto);

      expect(result).toEqual(mock);
    });
  });

  describe('GET /players', () => {
    it('should return list of players', async () => {
      const req = { user: { userId: '1' } };
      const mock = [{ id: 'p1', displayName: 'P1' }];
      mockPrisma.player.findMany.mockResolvedValue(mock);

      const result = await controller.findAll(req);

      expect(result).toEqual(mock);
    });
  });

  describe('GET /players/:id', () => {
    it('should return a player', async () => {
      const req = { user: { userId: '1' } };
      const mock = { id: 'p1', displayName: 'P1' };
      mockPrisma.player.findUnique.mockResolvedValue(mock);

      const result = await controller.findOne(req, 'p1');

      expect(result).toEqual(mock);
    });
  });

  describe('PATCH /players/:id', () => {
    it('should update player', async () => {
      const req = { user: { userId: '1' } };
      const dto = { displayName: 'Updated' };
      const mock = { id: 'p1', displayName: 'Updated' };
      mockPrisma.player.findFirst.mockResolvedValue(mock);
      mockPrisma.player.update.mockResolvedValue(mock);

      const result = await controller.update(req, 'p1', dto);

      expect(result).toEqual(mock);
    });
  });

  describe('DELETE /players/:id', () => {
    it('should delete player', async () => {
      const req = { user: { userId: '1' } };
      const mock = { id: 'p1', displayName: 'P1' };
      mockPrisma.player.findFirst.mockResolvedValue(mock);
      mockPrisma.player.delete.mockResolvedValue({});

      await controller.delete(req, 'p1');

      expect(prismaService.player.delete).toHaveBeenCalled();
    });
  });

  describe('GET /players/:id/statistics', () => {
    it('should return statistics', async () => {
      const mockPlayer = {
        id: 'p1',
        tournaments: [{
          id: 'tp1',
          playerId: 'p1',
          tournamentId: 't1',
          results: [],
        }],
      };
      mockPrisma.player.findUnique.mockResolvedValue(mockPlayer);
      mockPrisma.tournamentPlayer.findMany.mockResolvedValue([]);
      mockPrisma.pairing.findMany.mockResolvedValue([]);

      const result = await controller.getStatistics('p1');

      expect(result).toBeDefined();
    });
  });
});
