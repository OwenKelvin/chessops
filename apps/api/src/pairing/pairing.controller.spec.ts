import { vi, beforeEach, describe, it, expect } from 'vitest';

vi.mock('@prisma/client', () => ({
  PrismaClient: vi.fn().mockImplementation(() => ({})),
}));

import { Test, TestingModule } from '@nestjs/testing';
import { PairingController } from './pairing.controller';
import { PairingService } from './pairing.service';
import { PrismaService } from '../prisma/prisma.service';
import { WebhookService } from '../webhook/webhook.service';
import { BadRequestException } from '@nestjs/common';

const createMockPrismaService = () => ({
  tournament: { findUnique: vi.fn() },
  tournamentPlayer: { findMany: vi.fn() },
  pairing: { create: vi.fn(), findMany: vi.fn() },
  round: { findMany: vi.fn(), findFirst: vi.fn(), create: vi.fn() },
});

const createMockWebhookService = () => ({ publish: vi.fn() });

describe('PairingController', () => {
  let controller: PairingController;
  let mockPrisma: ReturnType<typeof createMockPrismaService>;
  let mockWebhook: ReturnType<typeof createMockWebhookService>;

  beforeEach(async () => {
    mockPrisma = createMockPrismaService();
    mockWebhook = createMockWebhookService();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PairingController],
      providers: [
        PairingService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: WebhookService, useValue: mockWebhook },
      ],
    }).compile();

    controller = module.get<PairingController>(PairingController);
  });

  describe('POST /tournaments/:tournamentId/pairings/generate/swiss', () => {
    it('should generate Swiss pairings', async () => {
      mockPrisma.tournament.findUnique.mockResolvedValue({ id: '1', format: 'swiss' });
      mockPrisma.tournamentPlayer.findMany.mockResolvedValue([
        { playerId: 'p1', seed: 1, rating: 1200, results: [], player: { rating: 1200 } },
        { playerId: 'p2', seed: 2, rating: 1100, results: [], player: { rating: 1100 } },
      ]);
      mockPrisma.round.findFirst.mockResolvedValue({ id: 'round1', roundNumber: 1 });
      mockPrisma.pairing.findMany.mockResolvedValue([]);
      mockPrisma.pairing.create.mockResolvedValue({ id: 'pair1' });

      const result = await controller.generateSwiss({ user: { userId: '1' } }, '1', { roundNumber: 1 });

      expect(result).toBeDefined();
      expect(result.pairings).toBeDefined();
    });

    it('should throw if roundNumber missing', async () => {
      await expect(controller.generateSwiss({ user: { userId: '1' } }, '1', {} as any)).rejects.toThrow('roundNumber is required');
    });
  });

  describe('POST /tournaments/:tournamentId/pairings/generate/roundrobin', () => {
    it('should generate Round-Robin pairings', async () => {
      mockPrisma.tournament.findUnique.mockResolvedValue({ id: '1', format: 'roundrobin' });
      mockPrisma.tournamentPlayer.findMany.mockResolvedValue([
        { playerId: 'p1', seed: 1, tournamentId: '1' },
        { playerId: 'p2', seed: 2, tournamentId: '1' },
      ]);
      mockPrisma.round.create.mockResolvedValue({ id: 'round1' });
      mockPrisma.pairing.create.mockResolvedValue({ id: 'pair1' });

      const result = await controller.generateRoundRobin({ user: { userId: '1' } }, '1');

      expect(result).toBeDefined();
      expect(result.rounds).toBeDefined();
    });
  });

  describe('POST /tournaments/:tournamentId/pairings/generate/elimination', () => {
    it('should generate Elimination pairings', async () => {
      mockPrisma.tournament.findUnique.mockResolvedValue({ id: '1', format: 'elimination' });
      mockPrisma.tournamentPlayer.findMany.mockResolvedValue([
        { playerId: 'p1', seed: 1, tournamentId: '1' },
        { playerId: 'p2', seed: 2, tournamentId: '1' },
      ]);
      mockPrisma.round.findFirst.mockResolvedValue({ id: 'round1', roundNumber: 1 });
      mockPrisma.pairing.findMany.mockResolvedValue([]);
      mockPrisma.pairing.create.mockResolvedValue({ id: 'pair1' });

      const result = await controller.generateElimination({ user: { userId: '1' } }, '1', { roundNumber: 1 });

      expect(result).toBeDefined();
      expect(result.pairings).toBeDefined();
    });

    it('should throw if roundNumber missing', async () => {
      await expect(controller.generateElimination({ user: { userId: '1' } }, '1', {} as any)).rejects.toThrow('roundNumber is required');
    });
  });
});
