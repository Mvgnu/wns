import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getServerSession } from 'next-auth';

import { getSafeServerSession, isAuthenticated, getCurrentUserId } from '@/lib/sessionHelper';

vi.mock('next-auth', () => ({ getServerSession: vi.fn() }));
vi.mock('@/lib/auth', () => ({ authOptions: {} }));

const mockedGetServerSession = vi.mocked(getServerSession);

describe('sessionHelper', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns session when available', async () => {
    mockedGetServerSession.mockResolvedValue({ user: { id: 'u1' } } as any);
    await expect(getSafeServerSession()).resolves.toEqual({ user: { id: 'u1' } });
    await expect(isAuthenticated()).resolves.toBe(true);
    await expect(getCurrentUserId()).resolves.toBe('u1');
  });

  it('returns null on JWT decryption error', async () => {
    mockedGetServerSession.mockRejectedValue(new Error('JWT_SESSION_ERROR: decryption operation failed'));
    await expect(getSafeServerSession()).resolves.toBeNull();
    await expect(isAuthenticated()).resolves.toBe(false);
    await expect(getCurrentUserId()).resolves.toBeNull();
  });

  it('returns null on unexpected error but logs it', async () => {
    mockedGetServerSession.mockRejectedValue(new Error('Network down'));
    await expect(getSafeServerSession()).resolves.toBeNull();
    await expect(isAuthenticated()).resolves.toBe(false);
    await expect(getCurrentUserId()).resolves.toBeNull();
  });
});
