/**
 * Unit tests for authentication utilities
 */
import bcrypt from 'bcryptjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  default: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}));

// Mock bcrypt
vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn(),
    compare: vi.fn(),
  },
}));

describe('Authentication Utils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Password hashing', () => {
    it('should hash passwords correctly', async () => {
      const mockHash = 'hashedPassword123';
      (bcrypt.hash as any).mockResolvedValue(mockHash);

      const password = 'plainPassword';
      const hashed = await bcrypt.hash(password, 12);

      expect(bcrypt.hash).toHaveBeenCalledWith(password, 12);
      expect(hashed).toBe(mockHash);
    });

    it('should compare passwords correctly', async () => {
      (bcrypt.compare as any).mockResolvedValue(true);

      const plainPassword = 'password123';
      const hashedPassword = 'hashedPassword';
      const isValid = await bcrypt.compare(plainPassword, hashedPassword);

      expect(bcrypt.compare).toHaveBeenCalledWith(plainPassword, hashedPassword);
      expect(isValid).toBe(true);
    });
  });
});
