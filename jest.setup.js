import 'dotenv/config'
import '@testing-library/jest-dom'

// Mock next/navigation and next/image for tests
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() }),
}));

jest.mock('next/image', () => (props) => {
  // eslint-disable-next-line @next/next/no-img-element
  return <img {...props} alt={props.alt || ''} />
});

// Use dynamic port based on environment or default to 3000
const PORT = process.env.PORT || 3000
process.env.NEXTAUTH_URL = process.env.NEXTAUTH_URL || `http://localhost:${PORT}`
process.env.NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET || 'test-secret'

// Update all hardcoded localhost:3000 references in test files
if (typeof jest !== 'undefined') {
  // This will be available during test runs
  process.env.BASE_URL = `http://localhost:${PORT}`
}

// Polyfill pointer capture & scroll APIs required by Radix UI in jsdom
if (typeof Element !== 'undefined') {
  if (!Element.prototype.hasPointerCapture) {
    // @ts-ignore
    Element.prototype.hasPointerCapture = () => false;
  }
  if (!Element.prototype.setPointerCapture) {
    // @ts-ignore
    Element.prototype.setPointerCapture = () => {};
  }
  if (!Element.prototype.scrollIntoView) {
    // @ts-ignore
    Element.prototype.scrollIntoView = () => {};
  }
}

// Polyfill ResizeObserver
if (typeof window !== 'undefined' && !('ResizeObserver' in window)) {
  // @ts-ignore
  global.ResizeObserver = class ResizeObserver {
    callback;
    constructor(cb) { this.callback = cb; }
    observe() {}
    unobserve() {}
    disconnect() {}
  };
} 