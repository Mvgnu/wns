import { vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import LocationsClientWrapper from '@/app/locations/components/LocationsClientWrapper'

vi.mock('next/navigation', () => {
	const push = vi.fn()
	const useSearchParams = () => new URLSearchParams('')
	return { useRouter: () => ({ push }), useSearchParams }
})

const sample = {
	locations: [
		{
			id: 'l1',
			name: 'City Gym',
			description: 'Modern gym',
			placeType: 'facility',
			detailType: 'gym',
			sport: 'fitness',
			sports: ['fitness'],
			address: 'Berlin',
			city: null,
			state: null,
			country: null,
			latitude: 52.52,
			longitude: 13.405,
			image: null,
			amenities: [],
			_count: { reviews: 0, events: 0 },
			averageRating: null,
			staff: [],
			claims: [],
		},
	],
	sportCounts: [{ sport: 'fitness', _count: { id: 1 } }],
	typeCounts: [{ placeType: 'facility', _count: { id: 1 } }],
	detailTypeCounts: [{ detailType: 'gym', _count: { id: 1 } }],
	amenityCounts: [{ type: 'parking', _count: { id: 1 } }],
	selectedSports: [],
	selectedType: '',
	selectedDetailType: '',
	selectedAmenities: [],
	allSports: [{ value: 'fitness', label: 'Fitness' }],
	totalLocationsCount: 1,
	userId: 'u1',
}

describe('LocationsClientWrapper', () => {
	it('renders a location card and allows searching', async () => {
		render(<LocationsClientWrapper {...sample} />)
		expect(screen.getByText('City Gym')).toBeInTheDocument()
		const inputs = screen.getAllByPlaceholderText(/Suche|Suchen|Suchen\.+|Suche nach/i)
		await userEvent.type(inputs[0], 'Gym')
		await userEvent.keyboard('{Enter}')
	})
}) 