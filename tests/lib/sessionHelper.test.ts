import { getSafeServerSession, isAuthenticated, getCurrentUserId } from '@/lib/sessionHelper'

jest.mock('next-auth', () => ({ getServerSession: jest.fn() }))
jest.mock('@/lib/auth', () => ({ authOptions: {} }))

const { getServerSession } = require('next-auth')

describe('sessionHelper', () => {
	beforeEach(() => { jest.clearAllMocks() })

	it('returns session when available', async () => {
		getServerSession.mockResolvedValue({ user: { id: 'u1' } })
		await expect(getSafeServerSession()).resolves.toEqual({ user: { id: 'u1' } })
		await expect(isAuthenticated()).resolves.toBe(true)
		await expect(getCurrentUserId()).resolves.toBe('u1')
	})

	it('returns null on JWT decryption error', async () => {
		getServerSession.mockRejectedValue(new Error('JWT_SESSION_ERROR: decryption operation failed'))
		await expect(getSafeServerSession()).resolves.toBeNull()
		await expect(isAuthenticated()).resolves.toBe(false)
		await expect(getCurrentUserId()).resolves.toBeNull()
	})

	it('returns null on unexpected error but logs it', async () => {
		getServerSession.mockRejectedValue(new Error('Network down'))
		await expect(getSafeServerSession()).resolves.toBeNull()
		await expect(isAuthenticated()).resolves.toBe(false)
		await expect(getCurrentUserId()).resolves.toBeNull()
	})
}) 