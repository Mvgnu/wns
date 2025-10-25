import { render, screen } from '@testing-library/react'
import GroupCard from '@/components/groups/GroupCard'

jest.mock('next/image', () => (props: any) => <img alt={props.alt || ''} />)

describe('GroupCard', () => {
	it('renders key group info', () => {
		render(
			<GroupCard
				id="g1"
				name="Run Club"
				description="We run"
				sport="running"
				location="Berlin"
				createdAt={new Date()}
				isPrivate={true}
				groupTags={["verein","team","fortgeschritten","extra"]}
				activityLevel="high"
				_count={{ members: 12 }}
			/>
		)
		expect(screen.getByText('Run Club')).toBeInTheDocument()
		expect(screen.getByText(/Mitglieder/)).toBeInTheDocument()
		expect(screen.getByText(/Privat/)).toBeInTheDocument()
		expect(screen.getByText(/Berlin/)).toBeInTheDocument()
		expect(screen.getByText(/Aktivität/i)).toBeInTheDocument()
		expect(screen.getByText(/verein/)).toBeInTheDocument()
	})
}) 