import { hasGroupPermission, hasClubPermission, mapClubToGroupPermissions, GroupPermission, ClubPermission } from '@/lib/models/permissions'

describe('permissions helpers', () => {
	it('hasGroupPermission returns true for explicit permission', () => {
		const perms = { group: { g1: [GroupPermission.CREATE_EVENTS] } }
		expect(hasGroupPermission(perms as any, 'g1', GroupPermission.CREATE_EVENTS)).toBe(true)
	})

	it('hasGroupPermission returns true with manage_group implying others', () => {
		const perms = { group: { g1: [GroupPermission.MANAGE_GROUP] } }
		expect(hasGroupPermission(perms as any, 'g1', GroupPermission.CREATE_POSTS)).toBe(true)
	})

	it('hasGroupPermission returns false when not granted', () => {
		const perms = { group: { g1: [GroupPermission.VIEW_GROUP] } }
		expect(hasGroupPermission(perms as any, 'g1', GroupPermission.MANAGE_EVENTS)).toBe(false)
	})

	it('hasClubPermission parallels group behavior', () => {
		const perms = { club: { c1: [ClubPermission.MANAGE_CLUB] } }
		expect(hasClubPermission(perms as any, 'c1', ClubPermission.CREATE_EVENTS)).toBe(true)
	})

	it('mapClubToGroupPermissions maps correctly when inheritToGroups true', () => {
		const mapped = mapClubToGroupPermissions([
			ClubPermission.MANAGE_EVENTS,
			ClubPermission.VIEW_GROUPS,
			ClubPermission.CREATE_EVENTS,
		], true)
		expect(mapped).toEqual(expect.arrayContaining([
			GroupPermission.MANAGE_EVENTS,
			GroupPermission.VIEW_GROUP,
			GroupPermission.CREATE_EVENTS,
		]))
	})

	it('mapClubToGroupPermissions returns empty when inheritToGroups false', () => {
		expect(mapClubToGroupPermissions([ClubPermission.MANAGE_EVENTS], false)).toEqual([])
	})
}) 