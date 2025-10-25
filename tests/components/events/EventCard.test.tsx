import { render, screen } from '@testing-library/react'
import EventCard from '@/components/events/EventCard'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

jest.mock('next-auth/react', () => ({
	useSession: () => ({ data: null, status: 'unauthenticated' }),
}))

describe('EventCard', () => {
	it('renders price badge when event is paid with price', () => {
		const event = {
			id: 'e1',
			title: 'Paid Match',
			description: 'Desc',
			startTime: new Date(Date.now() + 3600_000).toISOString(),
			endTime: new Date(Date.now() + 7200_000).toISOString(),
			isPaid: true,
			price: 12.5,
			priceCurrency: 'EUR',
			group: { id: 'g1', name: 'Group' },
			location: { id: 'l1', name: 'Loc' },
			_count: { attendees: 0 },
			attendees: [],
			maxAttendees: undefined,
			isSoldOut: false,
		}

		const qc = new QueryClient()
		render(
			<QueryClientProvider client={qc}>
				<EventCard event={event as any} showActions={false} />
			</QueryClientProvider>
		)

		// Badge contains a currency formatted value like 12,50 € (de-DE)
		expect(screen.getByText(/€|EUR|12/)).toBeInTheDocument()
	})
}) 