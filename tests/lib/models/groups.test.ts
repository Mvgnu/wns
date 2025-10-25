import { testDb } from '@/lib/test-utils/database'
import { 
  groupMemberStatusSchema,
  groupMemberRoleSchema,
  groupRoleSchema,
  groupSearchSchema,
  GroupVisibility,
  GroupJoinPolicy,
  GroupContentPolicy,
  GroupEventsPolicy,
  MembershipStatus,
  GROUP_VISIBILITY_LABELS,
  GROUP_JOIN_POLICY_LABELS,
  GROUP_CONTENT_POLICY_LABELS,
  GROUP_EVENTS_POLICY_LABELS
} from '@/lib/models/groups'
import { GroupPermission } from '@/lib/models/permissions'

describe('Group Models and Schemas', () => {
  describe('Enums and Constants', () => {
    it('should have correct group visibility values', () => {
      expect(GroupVisibility.PUBLIC).toBe('public')
      expect(GroupVisibility.PRIVATE).toBe('private')
      expect(GroupVisibility.HIDDEN).toBe('hidden')
    })

    it('should have correct group join policy values', () => {
      expect(GroupJoinPolicy.OPEN).toBe('open')
      expect(GroupJoinPolicy.REQUEST).toBe('request')
      expect(GroupJoinPolicy.INVITE).toBe('invite')
      expect(GroupJoinPolicy.CODE).toBe('code')
    })

    it('should have correct group content policy values', () => {
      expect(GroupContentPolicy.ANYONE).toBe('anyone')
      expect(GroupContentPolicy.APPROVED).toBe('approved')
      expect(GroupContentPolicy.ADMINS_ONLY).toBe('admins_only')
    })

    it('should have correct group events policy values', () => {
      expect(GroupEventsPolicy.ANYONE).toBe('anyone')
      expect(GroupEventsPolicy.APPROVED).toBe('approved')
      expect(GroupEventsPolicy.ADMINS_ONLY).toBe('admins_only')
    })

    it('should have correct membership status values', () => {
      expect(MembershipStatus.ACTIVE).toBe('active')
      expect(MembershipStatus.PENDING).toBe('pending')
      expect(MembershipStatus.INACTIVE).toBe('inactive')
      expect(MembershipStatus.BANNED).toBe('banned')
    })

    it('should have visibility labels', () => {
      expect(GROUP_VISIBILITY_LABELS[GroupVisibility.PUBLIC]).toBe('Public')
      expect(GROUP_VISIBILITY_LABELS[GroupVisibility.PRIVATE]).toBe('Private')
      expect(GROUP_VISIBILITY_LABELS[GroupVisibility.HIDDEN]).toBe('Hidden')
    })

    it('should have join policy labels', () => {
      expect(GROUP_JOIN_POLICY_LABELS[GroupJoinPolicy.OPEN]).toBe('Open to All')
      expect(GROUP_JOIN_POLICY_LABELS[GroupJoinPolicy.REQUEST]).toBe('Request to Join')
      expect(GROUP_JOIN_POLICY_LABELS[GroupJoinPolicy.INVITE]).toBe('Invitation Only')
      expect(GROUP_JOIN_POLICY_LABELS[GroupJoinPolicy.CODE]).toBe('Join with Code')
    })

    it('should have content policy labels', () => {
      expect(GROUP_CONTENT_POLICY_LABELS[GroupContentPolicy.ANYONE]).toBe('Anyone Can Post')
      expect(GROUP_CONTENT_POLICY_LABELS[GroupContentPolicy.APPROVED]).toBe('Posts Need Approval')
      expect(GROUP_CONTENT_POLICY_LABELS[GroupContentPolicy.ADMINS_ONLY]).toBe('Admins Only')
    })

    it('should have events policy labels', () => {
      expect(GROUP_EVENTS_POLICY_LABELS[GroupEventsPolicy.ANYONE]).toBe('Anyone Can Create')
      expect(GROUP_EVENTS_POLICY_LABELS[GroupEventsPolicy.APPROVED]).toBe('Events Need Approval')
      expect(GROUP_EVENTS_POLICY_LABELS[GroupEventsPolicy.ADMINS_ONLY]).toBe('Admins Only')
    })
  })

  describe('Schema Validation', () => {
    describe('groupMemberStatusSchema', () => {
      it('should validate valid group member status data', () => {
        const validData = {
          userId: 'user123',
          status: 'active',
          joinedAt: new Date(),
          invitedBy: 'user456',
          invitedAt: new Date(),
          lastActive: new Date(),
        }

        const result = groupMemberStatusSchema.safeParse(validData)
        expect(result.success).toBe(true)
      })

      it('should validate minimal group member status data', () => {
        const validData = {
          userId: 'user123',
        }

        const result = groupMemberStatusSchema.safeParse(validData)
        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data.status).toBe('active') // default value
        }
      })

      it('should reject invalid status values', () => {
        const invalidData = {
          userId: 'user123',
          status: 'invalid_status',
        }

        const result = groupMemberStatusSchema.safeParse(invalidData)
        expect(result.success).toBe(false)
      })
    })

    describe('groupMemberRoleSchema', () => {
      it('should validate valid group member role data', () => {
        const validData = {
          userId: 'user123',
          roleId: 'role456',
          assignedBy: 'user789',
        }

        const result = groupMemberRoleSchema.safeParse(validData)
        expect(result.success).toBe(true)
      })

      it('should reject missing required fields', () => {
        const invalidData = {
          userId: 'user123',
          // missing roleId and assignedBy
        }

        const result = groupMemberRoleSchema.safeParse(invalidData)
        expect(result.success).toBe(false)
      })
    })

    describe('groupRoleSchema', () => {
      it('should validate valid group role data', () => {
        const validData = {
          name: 'Admin',
          description: 'Full administrative control',
          color: '#F43F5E',
          permissions: [GroupPermission.MANAGE_MEMBERS, GroupPermission.VIEW_MEMBERS],
          isDefault: false,
        }

        const result = groupRoleSchema.safeParse(validData)
        expect(result.success).toBe(true)
      })

      it('should reject short names', () => {
        const invalidData = {
          name: 'A', // too short
          permissions: [GroupPermission.MANAGE_MEMBERS],
        }

        const result = groupRoleSchema.safeParse(invalidData)
        expect(result.success).toBe(false)
      })
    })

    describe('groupSearchSchema', () => {
      it('should validate valid search parameters', () => {
        const validData = {
          query: 'basketball',
          sport: 'basketball',
          location: 'New York',
          latitude: 40.7128,
          longitude: -74.0060,
          radius: 10,
          city: 'New York',
          state: 'NY',
          country: 'USA',
          tags: ['competitive', 'casual'],
          activityLevel: 'medium',
          includePrivate: false,
          status: 'active',
          page: 1,
          limit: 20,
        }

        const result = groupSearchSchema.safeParse(validData)
        expect(result.success).toBe(true)
      })

      it('should validate minimal search parameters', () => {
        const validData = {
          query: 'basketball',
        }

        const result = groupSearchSchema.safeParse(validData)
        expect(result.success).toBe(true)
      })

      it('should reject invalid activity level', () => {
        const invalidData = {
          activityLevel: 'invalid_level',
        }

        const result = groupSearchSchema.safeParse(invalidData)
        expect(result.success).toBe(false)
      })

      it('should reject invalid status', () => {
        const invalidData = {
          status: 'invalid_status',
        }

        const result = groupSearchSchema.safeParse(invalidData)
        expect(result.success).toBe(false)
      })

      it('should reject negative page numbers', () => {
        const invalidData = {
          page: -1,
        }

        const result = groupSearchSchema.safeParse(invalidData)
        expect(result.success).toBe(false)
      })

      it('should reject limit over 100', () => {
        const invalidData = {
          limit: 101,
        }

        const result = groupSearchSchema.safeParse(invalidData)
        expect(result.success).toBe(false)
      })
    })
  })
}) 