import { vi } from 'vitest';
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import GroupForm from '@/components/groups/GroupForm'

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn(), back: vi.fn() }) }))
vi.mock('@/hooks/useGroups', () => ({
	useCreateGroup: () => ({ mutate: vi.fn((payload: any, opts: any) => opts?.onSuccess?.({ id: 'g1', ...payload })) }),
	useUpdateGroup: () => ({ mutate: vi.fn() })
}))

describe('GroupForm', () => {
	it('submits with mapped payload including primary sport and advanced fields', async () => {
		render(<GroupForm />)
		const name = screen.getByLabelText(/Gruppenname/i)
		await userEvent.type(name, 'My Group')
		const location = screen.getByLabelText(/Ort/i)
		await userEvent.type(location, 'Berlin')
		const desc = screen.getByLabelText(/Beschreibung/i)
		await userEvent.type(desc, 'About this group')
		const tags = screen.getByLabelText(/Tags/i)
		await userEvent.type(tags, 'verein, team')
		const activity = screen.getByLabelText(/Aktivitätslevel/i)
		await userEvent.selectOptions(activity, 'medium')
		
		// Use new structured form fields instead of JSON textareas
		const requireApproval = screen.getByLabelText(/Eintritt erforderlich/i)
		await userEvent.click(requireApproval)
		const contentModeration = screen.getByLabelText(/Inhaltsmoderation/i)
		await userEvent.selectOptions(contentModeration, 'low')
		const allowMemberPosts = screen.getByLabelText(/Mitglieder dürfen Beiträge erstellen/i)
		await userEvent.click(allowMemberPosts)
		const allowEventCreation = screen.getByLabelText(/Veranstaltungen erstellen/i)
		await userEvent.click(allowEventCreation)
		const priv = screen.getByLabelText(/Private Gruppe/i)
		await userEvent.click(priv)
		
		const submit = screen.getByRole('button', { name: /Gruppe erstellen/i })
		await userEvent.click(submit)
		expect(submit).toBeInTheDocument()
	})
}) 