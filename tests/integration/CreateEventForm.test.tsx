/**
 * Integration tests for CreateEventForm component
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import CreateEventForm from '@/app/events/create/components/CreateEventForm';

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
}));

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams('groupId=test-group-id'),
}));

// Mock toast
vi.mock('@/components/ui/use-toast', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock react-leaflet
vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }: { children: React.ReactNode }) => <div data-testid="map">{children}</div>,
  TileLayer: () => <div data-testid="tile-layer" />,
  Marker: () => <div data-testid="marker" />,
  Popup: ({ children }: { children: React.ReactNode }) => <div data-testid="popup">{children}</div>,
  useMapEvents: () => ({}),
}));

describe('CreateEventForm', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
        mutations: {
          retry: false,
        },
      },
    });
    vi.clearAllMocks();
  });

  it('should render all form fields', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <CreateEventForm />
      </QueryClientProvider>
    );

    expect(screen.getByLabelText(/event title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/start date/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/start time/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/location/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create event/i })).toBeInTheDocument();
  });

  it('should validate required fields', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <CreateEventForm />
      </QueryClientProvider>
    );

    const submitButton = screen.getByRole('button', { name: /create event/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/title is required/i)).toBeInTheDocument();
    });
  });

  it('should submit form with valid data', async () => {
    const mockRouter = { push: vi.fn() };
    vi.mocked(require('next/navigation').useRouter).mockReturnValue(mockRouter);

    render(
      <QueryClientProvider client={queryClient}>
        <CreateEventForm />
      </QueryClientProvider>
    );

    // Fill out the form
    fireEvent.change(screen.getByLabelText(/event title/i), {
      target: { value: 'Test Event' },
    });
    fireEvent.change(screen.getByLabelText(/description/i), {
      target: { value: 'A test event description' },
    });

    // Set date and time
    const dateInput = screen.getByLabelText(/start date/i);
    fireEvent.change(dateInput, {
      target: { value: '2024-12-25' },
    });

    const timeInput = screen.getByLabelText(/start time/i);
    fireEvent.change(timeInput, {
      target: { value: '14:00' },
    });

    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /create event/i }));

    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith('/events/test-event-id');
    });
  });

  it('should show group pre-selection when groupId is provided', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <CreateEventForm />
      </QueryClientProvider>
    );

    // Should show group selection or pre-selected group
    // This depends on the actual implementation
    expect(screen.getByTestId('group-selection')).toBeInTheDocument();
  });
});
