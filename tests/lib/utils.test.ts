import { cn, formatDate, formatTime, formatDateTime, truncate, getInitials, truncateText, slugify } from '@/lib/utils'

describe('lib/utils', () => {
	it('cn merges class names and removes conflicts', () => {
		const result = cn('px-2', { hidden: false, block: true }, 'px-4')
		expect(result).toMatch(/px-4/)
		expect(result).toMatch(/block/)
		expect(result).not.toMatch(/hidden/)
	})

	it('formats date/time and datetime', () => {
		const iso = '2025-01-15T10:30:00.000Z'
		expect(formatDate(iso)).toBeTruthy()
		expect(formatTime(iso)).toBeTruthy()
		expect(formatDateTime(iso)).toContain(',')
	})

	it('truncate functions and initials', () => {
		expect(truncate('abcdef', 3)).toBe('abc...')
		expect(getInitials('John Doe')).toBe('JD')
		expect(truncateText('abcd', 10)).toBe('abcd')
		expect(truncateText('abcdefgh', 4)).toBe('abcd...')
	})

	it('slugify converts to url-friendly', () => {
		expect(slugify('Hello, World!')).toBe('hello-world')
	})
}) 