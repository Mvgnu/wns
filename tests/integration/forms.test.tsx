/**
 * Integration tests for forms and components
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SessionProvider } from 'next-auth/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import CreateGroupForm from '@/components/groups/CreateGroupForm';

// Mock next-auth
vi.mock('next-auth/react', () => ({
  useSession: () => ({
    data: {
      user: {
        id: 'test-user-id',
        name: 'Test User',
        email: 'test@example.com',
      },
    },
    status: 'authenticated',
  }),
  SessionProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
  }),
}));

// Mock toast
vi.mock('@/components/ui/use-toast', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('Form Components', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    vi.clearAllMocks();
  });

  describe('CreateGroupForm', () => {
    it('should render form fields correctly', () => {
      render(
        <QueryClientProvider client={queryClient}>
          <SessionProvider>
            <CreateGroupForm />
          </SessionProvider>
        </QueryClientProvider>
      );

      expect(screen.getByLabelText(/group name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/sport/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/location/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /create group/i })).toBeInTheDocument();
    });

    it('should validate required fields', async () => {
      render(
        <QueryClientProvider client={queryClient}>
          <SessionProvider>
            <CreateGroupForm />
          </SessionProvider>
        </QueryClientProvider>
      );

      const submitButton = screen.getByRole('button', { name: /create group/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/name is required/i)).toBeInTheDocument();
      });
    });

    it('should submit form with valid data', async () => {
      const mockRouter = { push: vi.fn() };
      vi.mocked(require('next/navigation').useRouter).mockReturnValue(mockRouter);

      render(
        <QueryClientProvider client={queryClient}>
          <SessionProvider>
            <CreateGroupForm />
          </SessionProvider>
        </QueryClientProvider>
      );

      // Fill out the form
      fireEvent.change(screen.getByLabelText(/group name/i), {
        target: { value: 'Test Group' },
      });
      fireEvent.change(screen.getByLabelText(/description/i), {
        target: { value: 'A test group description' },
      });
      fireEvent.change(screen.getByLabelText(/sport/i), {
        target: { value: 'running' },
      });
      fireEvent.change(screen.getByLabelText(/location/i), {
        target: { value: 'Berlin, Germany' },
      });

      // Submit the form
      fireEvent.click(screen.getByRole('button', { name: /create group/i }));

      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith('/groups/test-group');
      });
    });
  });
});

