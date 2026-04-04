import { beforeEach, vi } from 'vitest';

// Mock Prisma client
vi.mock('@prisma/client', () => ({
  PrismaClient: vi.fn().mockImplementation(() => ({
    $connect: vi.fn(),
    $disconnect: vi.fn(),
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findMany: vi.fn(),
    },
    session: {
      deleteMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
    },
    oauthAccount: {
      findUnique: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
      deleteMany: vi.fn(),
    },
    emailVerification: {
      deleteMany: vi.fn(),
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    mfaSecret: {
      deleteMany: vi.fn(),
    },
    accountRecovery: {
      deleteMany: vi.fn(),
    },
    tournament: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findMany: vi.fn(),
    },
    tournamentPlayer: {
      create: vi.fn(),
      delete: vi.fn(),
      findMany: vi.fn(),
    },
    player: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findMany: vi.fn(),
    },
    round: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      findMany: vi.fn(),
    },
    pairing: {
      create: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
    webhookEvent: {
      create: vi.fn(),
    },
    app: {
      findMany: vi.fn(),
    },
  })),
}));

beforeEach(() => {
  // Clear all mocks before each test
  vi.clearAllMocks();
});
