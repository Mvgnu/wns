import '@testing-library/jest-dom/vitest';
import 'dotenv/config';
import { vi } from 'vitest';
import * as PrismaRuntime from '@prisma/client';

// Provide Jest-compatible globals for migrated tests
const jestLike = vi as unknown as typeof vi & { mocked: typeof vi.mocked };
jestLike.mocked = vi.mocked.bind(vi);
(globalThis as any).jest = jestLike;

// Ensure Prisma enums exist at runtime for unit tests even when prisma generate fails
const prismaAny = ((PrismaRuntime as unknown as { default?: unknown }).default ?? PrismaRuntime) as Record<string, any>;

const ensureEnum = (key: string, values: Record<string, string>) => {
  if (!prismaAny[key]) {
    prismaAny[key] = Object.freeze(values);
  }
  if (prismaAny.Prisma && !prismaAny.Prisma[key]) {
    prismaAny.Prisma[key] = prismaAny[key];
  }
};

ensureEnum('EventRSVPStatus', {
  CONFIRMED: 'CONFIRMED',
  WAITLISTED: 'WAITLISTED',
  CANCELLED: 'CANCELLED',
  CHECKED_IN: 'CHECKED_IN',
  NO_SHOW: 'NO_SHOW',
});

ensureEnum('EventAttendanceAction', {
  RSVP_CONFIRMED: 'RSVP_CONFIRMED',
  RSVP_WAITLISTED: 'RSVP_WAITLISTED',
  RSVP_CANCELLED: 'RSVP_CANCELLED',
  CHECKED_IN: 'CHECKED_IN',
  MARKED_NO_SHOW: 'MARKED_NO_SHOW',
});

ensureEnum('MembershipStatus', {
  active: 'active',
  past_due: 'past_due',
  canceled: 'canceled',
});

// Mock environment variables for tests
process.env.NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET || 'test-secret';
process.env.NEXTAUTH_URL = process.env.NEXTAUTH_URL || `http://localhost:${process.env.PORT || 3000}`;

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/',
}));

// Mock Next.js Image component
vi.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props} alt={props.alt || ''} />;
  },
}));

// Mock NextAuth
vi.mock('next-auth/react', () => ({
  useSession: () => ({
    data: null,
    status: 'unauthenticated',
  }),
  signIn: vi.fn(),
  signOut: vi.fn(),
  SessionProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// Global test utilities
if (typeof HTMLElement !== 'undefined') {
  if (!HTMLElement.prototype.hasPointerCapture) {
    HTMLElement.prototype.hasPointerCapture = () => false;
  }
  if (!HTMLElement.prototype.setPointerCapture) {
    HTMLElement.prototype.setPointerCapture = () => {};
  }
  if (!HTMLElement.prototype.releasePointerCapture) {
    HTMLElement.prototype.releasePointerCapture = () => {};
  }
}
if (typeof ResizeObserver === 'undefined') {
  class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  (globalThis as any).ResizeObserver = ResizeObserver;
}
global.fetch = vi.fn();
