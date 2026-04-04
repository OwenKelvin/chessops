import { vi, beforeEach, describe, it, expect } from 'vitest';

vi.mock('@prisma/client', () => ({
  PrismaClient: vi.fn().mockImplementation(() => ({})),
}));

import { Test, TestingModule } from '@nestjs/testing';
import { TiebreakController } from './tiebreak.controller';
import { TiebreakService } from './tiebreak.service';
import { PrismaService } from '../prisma/prisma.service';

const createMockPrismaService = () => ({
  tournament: { findUnique: vi.fn(), rounds: [] },
  tournamentPlayer: { findMany: vi.fn() },
  pairing: { findMany: vi.fn() },
});

describe('TiebreakController', () => {
  let controller: TiebreakController;
  let prismaService: PrismaService;
  let mockPrisma: ReturnType<typeof createMockPrismaService>;

  beforeEach(async () => {
    mockPrisma = createMockPrismaService();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TiebreakController],
      providers: [
        TiebreakService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    controller = module.get<TiebreakController>(TiebreakController);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  describe('GET /api/tournaments/:tournamentId/standings', () => {
    it('should return standings', async () => {
      mockPrisma.tournament.findUnique.mockResolvedValue({ id: '1' });
      mockPrisma.tournamentPlayer.findMany.mockResolvedValue([]);
      mockPrisma.pairing.findMany.mockResolvedValue([]);

      const result = await controller.getStandings('1');

      expect(result).toHaveProperty('standings');
    });
  });

  describe('GET /api/tournaments/:tournamentId/standings/:playerId/details', () => {
    it('should return tiebreak details', async () => {
      mockPrisma.tournament.findUnique.mockResolvedValue({ id: '1', rounds: [] });
      mockPrisma.tournamentPlayer.findMany.mockResolvedValue([
        { playerId: 'p1', tournamentId: '1', results: [], player: { firstName: 'Test', lastName: 'Player' } },
      ]);
      mockPrisma.pairing.findMany.mockResolvedValue([]);

      const result = await controller.getTiebreakDetails('1', 'p1');

      expect(result).toBeDefined();
    });
  });

  describe('GET /api/tournaments/:tournamentId/standings/by/:tiebreak', () => {
    it('should return standings sorted by tiebreak', async () => {
      mockPrisma.tournament.findUnique.mockResolvedValue({ id: '1' });
      mockPrisma.tournamentPlayer.findMany.mockResolvedValue([]);
      mockPrisma.pairing.findMany.mockResolvedValue([]);

      const result = await controller.getByTiebreak('1', 'buchholz');

      expect(result).toHaveProperty('sortedBy', 'buchholz');
      expect(result).toHaveProperty('standings');
    });

    it('should return error for invalid tiebreak', async () => {
      mockPrisma.tournament.findUnique.mockResolvedValue({ id: '1' });
      mockPrisma.tournamentPlayer.findMany.mockResolvedValue([]);
      mockPrisma.pairing.findMany.mockResolvedValue([]);

      const result = await controller.getByTiebreak('1', 'invalid');

      expect(result).toHaveProperty('error', 'Invalid tiebreak type');
    });
  });
});
