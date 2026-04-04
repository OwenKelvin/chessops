import { vi, beforeEach, describe, it, expect } from 'vitest';

vi.mock('@prisma/client', () => ({
  PrismaClient: vi.fn().mockImplementation(() => ({})),
}));

import { Test, TestingModule } from '@nestjs/testing';
import { TournamentController } from './tournament.controller';
import { TournamentService } from './tournament.service';
import { PrismaService } from '../prisma/prisma.service';
import { WebhookService } from '../webhook/webhook.service';
import { BadRequestException } from '@nestjs/common';

const createMockPrismaService = () => ({
  tournament: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn(), findMany: vi.fn() },
  tournamentPlayer: { create: vi.fn(), delete: vi.fn(), findMany: vi.fn(), deleteMany: vi.fn(), findFirst: vi.fn() },
  round: { create: vi.fn(), findUnique: vi.fn(), update: vi.fn(), findMany: vi.fn() },
  pairing: { create: vi.fn(), findMany: vi.fn(), update: vi.fn(), findUnique: vi.fn() },
  user: { findUnique: vi.fn() },
  result: { create: vi.fn() },
});

const createMockWebhookService = () => ({ publish: vi.fn() });

describe('TournamentController', () => {
  let controller: TournamentController;
  let prismaService: PrismaService;
  let mockPrisma: ReturnType<typeof createMockPrismaService>;
  let mockWebhook: ReturnType<typeof createMockWebhookService>;

  beforeEach(async () => {
    mockPrisma = createMockPrismaService();
    mockWebhook = createMockWebhookService();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TournamentController],
      providers: [
        TournamentService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: WebhookService, useValue: mockWebhook },
      ],
    }).compile();

    controller = module.get<TournamentController>(TournamentController);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  describe('POST /tournaments', () => {
    it('should create a tournament', async () => {
      const req = { user: { userId: '1' } };
      const dto = { name: 'Test', format: 'swiss' };
      const mock = { id: '1', name: dto.name, ownerId: req.user.userId };
      mockPrisma.tournament.create.mockResolvedValue(mock);
      mockWebhook.publish.mockResolvedValue(undefined);

      const result = await controller.create(req, dto);

      expect(result).toEqual(mock);
    });
  });

  describe('GET /tournaments', () => {
    it('should return list of tournaments', async () => {
      const req = { user: { userId: '1' } };
      const mock = [{ id: '1', name: 'T1' }];
      mockPrisma.tournament.findMany.mockResolvedValue(mock);

      const result = await controller.findAll(req);

      expect(result).toEqual(mock);
    });
  });

  describe('GET /tournaments/:id', () => {
    it('should return a tournament', async () => {
      const req = { user: { userId: '1' } };
      const mock = { id: '1', name: 'Test' };
      mockPrisma.tournament.findUnique.mockResolvedValue(mock);

      const result = await controller.findOne(req, '1');

      expect(result).toEqual(mock);
    });
  });

  describe('POST /tournaments/:id/players', () => {
    it('should add player', async () => {
      const req = { user: { userId: '1' } };
      const body = { playerId: 'p1', seed: 1 };
      mockPrisma.tournament.findUnique.mockResolvedValue({ id: '1', registrationOpen: true });
      mockPrisma.tournamentPlayer.create.mockResolvedValue({ id: 'p1', playerId: 'p1', player: { firstName: 'Test', lastName: 'Player' } });

      const result = await controller.addPlayer(req, '1', body);

      expect(result).toBeDefined();
    });

    it('should throw if playerId missing', async () => {
      const req = { user: { userId: '1' } };
      await expect(controller.addPlayer(req, '1', { seed: 1 } as any)).rejects.toThrow('playerId is required');
    });
  });

  describe('DELETE /tournaments/:id/players/:playerId', () => {
    it('should remove player', async () => {
      const req = { user: { userId: '1' } };
      mockPrisma.tournamentPlayer.deleteMany.mockResolvedValue({});

      await controller.removePlayer(req, '1', 'p1');

      expect(prismaService.tournamentPlayer.deleteMany).toHaveBeenCalled();
    });
  });

  describe('POST /tournaments/:id/rounds', () => {
    it('should create round', async () => {
      const body = { roundNumber: 1 };
      mockPrisma.tournament.findUnique.mockResolvedValue({ id: '1' });
      mockPrisma.round.create.mockResolvedValue({ id: 'r1' });

      const result = await controller.createRound('1', body);

      expect(result).toBeDefined();
    });

    it('should throw if roundNumber missing', async () => {
      await expect(controller.createRound('1', {} as any)).rejects.toThrow('roundNumber is required');
    });
  });

  describe('POST /tournaments/:id/pairings', () => {
    it('should create pairing', async () => {
      const body = { roundId: 'r1', whiteId: 'p1', blackId: 'p2' };
      const mockPairing = {
        id: 'pair1',
        white: { firstName: 'White', lastName: 'Player' },
        black: { firstName: 'Black', lastName: 'Player' },
      };
      mockPrisma.pairing.create.mockResolvedValue(mockPairing);
      mockPrisma.pairing.findMany.mockResolvedValue([mockPairing]);

      const result = await controller.createPairing('1', body);

      expect(result).toBeDefined();
    });

    it('should throw if fields missing', async () => {
      await expect(controller.createPairing('1', { roundId: 'r1' } as any)).rejects.toThrow('required');
    });
  });

  describe('POST /tournaments/:id/results', () => {
    it('should submit result', async () => {
      const body = { pairingId: 'pair1', result: '1-0' };
      const mockPairing = {
        id: 'pair1',
        result: '1-0',
        round: { tournamentId: '1', id: 'r1' },
        whiteId: 'p1',
        blackId: 'p2',
        white: { firstName: 'White', lastName: 'Player' },
        black: { firstName: 'Black', lastName: 'Player' },
      };
      const mockTournamentPlayer = { id: 'tp1', playerId: 'p1', tournamentId: '1' };
      mockPrisma.pairing.findUnique.mockResolvedValue(mockPairing);
      mockPrisma.pairing.update.mockResolvedValue(mockPairing);
      mockPrisma.tournamentPlayer.findFirst.mockResolvedValue(mockTournamentPlayer);
      mockPrisma.result.create.mockResolvedValue({});

      const result = await controller.submitResult('1', body);

      expect(result).toBeDefined();
    });

    it('should throw if fields missing', async () => {
      await expect(controller.submitResult('1', { pairingId: 'p1' } as any)).rejects.toThrow('required');
    });
  });
});
