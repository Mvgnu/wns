/**
 * Group models and utilities
 * This file provides types and helper functions for working with groups and their members
 */

import { UserPermissions } from './permissions';
import { z } from 'zod';
import { GroupPermission } from './permissions';

// Group Visibility enum
export enum GroupVisibility {
  PUBLIC = 'public',
  PRIVATE = 'private',
  HIDDEN = 'hidden' // Only visible to members and invited users
}

// Group visibility labels for UI display
export const GROUP_VISIBILITY_LABELS: Record<GroupVisibility, string> = {
  [GroupVisibility.PUBLIC]: 'Public',
  [GroupVisibility.PRIVATE]: 'Private',
  [GroupVisibility.HIDDEN]: 'Hidden'
};

// Group visibility descriptions for tooltips
export const GROUP_VISIBILITY_DESCRIPTIONS: Record<GroupVisibility, string> = {
  [GroupVisibility.PUBLIC]: 'Anyone can find and view this group',
  [GroupVisibility.PRIVATE]: 'Anyone can find this group, but only members can view its content',
  [GroupVisibility.HIDDEN]: 'Only members and invited users can find and view this group'
};

// Group Join Policy enum
export enum GroupJoinPolicy {
  OPEN = 'open', // Anyone can join
  REQUEST = 'request', // Anyone can request to join, approval required
  INVITE = 'invite', // Only invited users can join
  CODE = 'code' // Join using invitation code
}

// Group join policy labels for UI display
export const GROUP_JOIN_POLICY_LABELS: Record<GroupJoinPolicy, string> = {
  [GroupJoinPolicy.OPEN]: 'Open to All',
  [GroupJoinPolicy.REQUEST]: 'Request to Join',
  [GroupJoinPolicy.INVITE]: 'Invitation Only',
  [GroupJoinPolicy.CODE]: 'Join with Code'
};

// Group join policy descriptions for tooltips
export const GROUP_JOIN_POLICY_DESCRIPTIONS: Record<GroupJoinPolicy, string> = {
  [GroupJoinPolicy.OPEN]: 'Anyone can join this group instantly without approval',
  [GroupJoinPolicy.REQUEST]: 'Anyone can request to join, but an admin or moderator needs to approve',
  [GroupJoinPolicy.INVITE]: 'Only people who receive a direct invitation can join',
  [GroupJoinPolicy.CODE]: 'People need an invitation code to join the group'
};

// Group Content Policy enum
export enum GroupContentPolicy {
  ANYONE = 'anyone', // Any member can post content
  APPROVED = 'approved', // Posts need to be approved
  ADMINS_ONLY = 'admins_only' // Only admins and moderators can post
}

// Group content policy labels for UI display
export const GROUP_CONTENT_POLICY_LABELS: Record<GroupContentPolicy, string> = {
  [GroupContentPolicy.ANYONE]: 'Anyone Can Post',
  [GroupContentPolicy.APPROVED]: 'Posts Need Approval',
  [GroupContentPolicy.ADMINS_ONLY]: 'Admins Only'
};

// Group content policy descriptions for tooltips
export const GROUP_CONTENT_POLICY_DESCRIPTIONS: Record<GroupContentPolicy, string> = {
  [GroupContentPolicy.ANYONE]: 'Any member can post content to the group',
  [GroupContentPolicy.APPROVED]: 'Posts need to be approved by an admin or moderator',
  [GroupContentPolicy.ADMINS_ONLY]: 'Only admins and moderators can post content'
};

// Group Events Policy enum
export enum GroupEventsPolicy {
  ANYONE = 'anyone', // Any member can create events
  APPROVED = 'approved', // Events need to be approved
  ADMINS_ONLY = 'admins_only' // Only admins and moderators can create events
}

// Group events policy labels for UI display
export const GROUP_EVENTS_POLICY_LABELS: Record<GroupEventsPolicy, string> = {
  [GroupEventsPolicy.ANYONE]: 'Anyone Can Create',
  [GroupEventsPolicy.APPROVED]: 'Events Need Approval',
  [GroupEventsPolicy.ADMINS_ONLY]: 'Admins Only'
};

// Group events policy descriptions for tooltips
export const GROUP_EVENTS_POLICY_DESCRIPTIONS: Record<GroupEventsPolicy, string> = {
  [GroupEventsPolicy.ANYONE]: 'Any member can create events for the group',
  [GroupEventsPolicy.APPROVED]: 'Events need to be approved by an admin or moderator',
  [GroupEventsPolicy.ADMINS_ONLY]: 'Only admins and moderators can create events'
};

// Group membership status enum
export enum MembershipStatus {
  ACTIVE = 'active',
  PENDING = 'pending',
  INVITED = 'invited',
  INACTIVE = 'inactive',
  BANNED = 'banned'
}

// Group membership status labels for UI display
export const MEMBERSHIP_STATUS_LABELS: Record<MembershipStatus, string> = {
  [MembershipStatus.ACTIVE]: 'Active',
  [MembershipStatus.PENDING]: 'Pending Approval',
  [MembershipStatus.INVITED]: 'Invited',
  [MembershipStatus.INACTIVE]: 'Inactive',
  [MembershipStatus.BANNED]: 'Banned'
};

// Interface for group member
export interface GroupMember {
  id: string;
  userId: string;
  groupId: string;
  roleId: string;
  status: MembershipStatus;
  joinedAt?: Date;
  invitedBy?: string;
  invitedAt?: Date;
  lastActive?: Date;
}

// Interface for group member with role and user information
export interface GroupMemberWithDetails extends GroupMember {
  user: {
    id: string;
    name: string;
    email: string;
    image?: string;
  };
  role: {
    id: string;
    name: string;
    description?: string;
    permissions: string[];
  };
}

// Group entry rules interface
export interface GroupEntryRules {
  joinPolicy: GroupJoinPolicy;
  approvalRequired: boolean;
  invitationCode?: string;
  requiresProfile: boolean;
  ageRestriction?: {
    minimumAge?: number;
    maximumAge?: number;
  };
  questionnaire?: {
    questions: {
      id: string;
      text: string;
      required: boolean;
    }[];
  };
  termsAndConditions?: string;
}

// Group settings interface
export interface GroupSettings {
  visibility: GroupVisibility;
  contentPolicy: GroupContentPolicy;
  eventsPolicy: GroupEventsPolicy;
  joinPolicy: GroupJoinPolicy;
  allowMembersToInvite: boolean;
  showMemberList: boolean;
  defaultMemberRole: string;
  customTheme?: {
    primaryColor?: string;
    secondaryColor?: string;
    bannerUrl?: string;
    logoUrl?: string;
  };
  notifications?: {
    newMembers: boolean;
    newPosts: boolean;
    newEvents: boolean;
    eventReminders: boolean;
  };
}

// Get default group entry rules
export function getDefaultGroupEntryRules(): GroupEntryRules {
  return {
    joinPolicy: GroupJoinPolicy.REQUEST,
    approvalRequired: true,
    requiresProfile: false
  };
}

// Get default group settings
export function getDefaultGroupSettings(): GroupSettings {
  return {
    visibility: GroupVisibility.PUBLIC,
    contentPolicy: GroupContentPolicy.ANYONE,
    eventsPolicy: GroupEventsPolicy.APPROVED,
    joinPolicy: GroupJoinPolicy.REQUEST,
    allowMembersToInvite: true,
    showMemberList: true,
    defaultMemberRole: 'member',
    notifications: {
      newMembers: true,
      newPosts: true,
      newEvents: true,
      eventReminders: true
    }
  };
}

// Generate a random invitation code
export function generateInvitationCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Omitting characters that might be confused
  let code = '';
  
  // Generate a 6-character code
  for (let i = 0; i < 6; i++) {
    const randomIndex = Math.floor(Math.random() * chars.length);
    code += chars.charAt(randomIndex);
  }
  
  return code;
}

// Helper to determine if a user can perform an action in a group
export function canPerformGroupAction(
  action: 'view' | 'join' | 'post' | 'createEvent',
  userPermissions: UserPermissions | null,
  groupId: string,
  groupSettings: GroupSettings,
  memberStatus?: MembershipStatus
): boolean {
  // If no user or permissions, check public access only
  if (!userPermissions) {
    if (action === 'view') {
      return groupSettings.visibility === GroupVisibility.PUBLIC;
    }
    return false;
  }
  
  // Check if user has the MANAGE_GROUP permission, which grants all access
  if (userPermissions.group?.[groupId]?.includes(GroupPermission.MANAGE_GROUP)) {
    return true;
  }
  
  // For active members, check specific permissions
  if (memberStatus === MembershipStatus.ACTIVE) {
    switch (action) {
      case 'view':
        return true; // Active members can always view
        
      case 'join':
        return false; // Already a member
        
      case 'post':
        if (groupSettings.contentPolicy === GroupContentPolicy.ADMINS_ONLY) {
          return userPermissions.group?.[groupId]?.includes(GroupPermission.MANAGE_CONTENT) || false;
        }
        return true; // For ANYONE policy, all members can post
        
      case 'createEvent':
        if (groupSettings.eventsPolicy === GroupEventsPolicy.ADMINS_ONLY) {
          return userPermissions.group?.[groupId]?.includes(GroupPermission.MANAGE_EVENTS) || false;
        }
        return true; // For ANYONE policy, all members can create events
    }
  }
  
  // For non-members or non-active members
  if (action === 'view') {
    return groupSettings.visibility === GroupVisibility.PUBLIC;
  } else if (action === 'join') {
    // Pending or invited members cannot rejoin
    if (memberStatus === MembershipStatus.PENDING || memberStatus === MembershipStatus.INVITED) {
      return false;
    }
    
    // Check join policy
    switch (groupSettings.joinPolicy) {
      case GroupJoinPolicy.OPEN:
        return true;
      case GroupJoinPolicy.REQUEST:
      case GroupJoinPolicy.CODE:
      case GroupJoinPolicy.INVITE:
        return false; // These require additional validation
    }
  }
  
  return false;
}

// Helper to check if a user can manage a member in a group
export function canManageGroupMember(
  userPermissions: UserPermissions | null,
  groupId: string,
  targetMemberRole: string,
  targetUserId: string,
  currentUserId: string
): boolean {
  // If no permissions, cannot manage
  if (!userPermissions || !userPermissions.group?.[groupId]) {
    return false;
  }
  
  // Cannot manage self (except for leaving)
  if (targetUserId === currentUserId) {
    return false;
  }
  
  // Check if user has manage members permission
  const canManageMembers = userPermissions.group[groupId].includes(GroupPermission.MANAGE_MEMBERS);
  
  // Check if user has manage group permission (admins)
  const isAdmin = userPermissions.group[groupId].includes(GroupPermission.MANAGE_GROUP);
  
  // Admins can manage anyone except other admins
  if (isAdmin) {
    // Cannot manage other admins (prevent privilege escalation)
    const targetIsAdmin = targetMemberRole === 'admin';
    return !targetIsAdmin;
  }
  
  // Moderators can manage regular members
  if (canManageMembers) {
    // Cannot manage admins or other moderators
    const targetIsAdmin = targetMemberRole === 'admin';
    const targetIsModerator = targetMemberRole === 'moderator';
    return !targetIsAdmin && !targetIsModerator;
  }
  
  return false;
}

// Group entry rules validation schema
export const groupEntryRulesSchema = z.object({
  requireApproval: z.boolean().default(false),
  allowPublicJoin: z.boolean().default(true),
  inviteOnly: z.boolean().default(false),
  joinCode: z.string().nullable().optional(),
  maxMembers: z.number().int().positive().optional(),
});

// Use type alias instead of re-exporting to avoid conflicts
export type GroupEntryRulesData = z.infer<typeof groupEntryRulesSchema>;

// Group settings validation schema
export const groupSettingsSchema = z.object({
  allowMemberPosts: z.boolean().default(true),
  allowMemberEvents: z.boolean().default(false),
  visibility: z.enum(['public', 'private', 'unlisted']).default('public'),
  contentModeration: z.enum(['none', 'low', 'medium', 'high']).default('low'),
  notifyOnNewMembers: z.boolean().default(true),
  notifyOnNewPosts: z.boolean().default(true),
  notifyOnNewEvents: z.boolean().default(true),
});

// Use type alias instead of re-exporting to avoid conflicts
export type GroupSettingsData = z.infer<typeof groupSettingsSchema>;

/**
 * Group validation schema
 */
export const groupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().optional(),
  image: z.string().url().optional(),
  sport: z.string(),
  location: z.string().optional(),
  isPrivate: z.boolean().optional().default(false),
  entryRules: groupEntryRulesSchema.optional(),
  settings: groupSettingsSchema.optional(),
  
  // Enhanced location data
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  locationName: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  zipCode: z.string().optional(),
  
  // Group categorization
  groupTags: z.array(z.string()).optional(),
  activityLevel: z.enum(['low', 'medium', 'high']).optional(),
  
  // New fields
  slug: z.string().optional(),
  status: z.enum(['active', 'inactive', 'archived']).default('active'),
});

export type GroupData = z.infer<typeof groupSchema>;

/**
 * Group role validation schema
 */
export const groupRoleSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().optional(),
  color: z.string().optional(),
  permissions: z.array(z.nativeEnum(GroupPermission)),
  isDefault: z.boolean().optional(),
});

export type GroupRoleData = z.infer<typeof groupRoleSchema>;

/**
 * Default group roles
 */
export const DEFAULT_ZONED_GROUP_ROLES: GroupRoleData[] = [
  {
    name: 'Admin',
    description: 'Full administrative control of the group',
    color: '#F43F5E', // Rose-500
    permissions: Object.values(GroupPermission),
    isDefault: false,
  },
  {
    name: 'Moderator',
    description: 'Can manage members and content',
    color: '#3B82F6', // Blue-500
    permissions: [
      GroupPermission.MANAGE_MEMBERS,
      GroupPermission.VIEW_MEMBERS,
      GroupPermission.VIEW_ANALYTICS,
      GroupPermission.CREATE_EVENTS,
      GroupPermission.MANAGE_CONTENT,
      GroupPermission.MODERATE_CONTENT,
      GroupPermission.CREATE_POSTS,
      GroupPermission.INVITE_MEMBERS,
    ],
    isDefault: false,
  },
  {
    name: 'Member',
    description: 'Regular group member',
    color: '#6B7280', // Gray-500
    permissions: [
      GroupPermission.VIEW_MEMBERS,
      GroupPermission.CREATE_POSTS,
      GroupPermission.VIEW_GROUP,
      GroupPermission.VIEW_EVENTS,
    ],
    isDefault: true,
  },
];

/**
 * Group member status validation schema
 */
export const groupMemberStatusSchema = z.object({
  userId: z.string(),
  status: z.enum(['active', 'inactive', 'pending', 'banned']).default('active'),
  joinedAt: z.date().optional(),
  invitedBy: z.string().optional(),
  invitedAt: z.date().optional(),
  lastActive: z.date().optional(),
});

export type GroupMemberStatusData = z.infer<typeof groupMemberStatusSchema>;

/**
 * Group member role validation schema
 */
export const groupMemberRoleSchema = z.object({
  userId: z.string(),
  roleId: z.string(),
  assignedBy: z.string(),
});

export type GroupMemberRoleData = z.infer<typeof groupMemberRoleSchema>;

/**
 * Group search validation schema
 */
export const groupSearchSchema = z.object({
  query: z.string().optional(),
  sport: z.string().optional(),
  location: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  radius: z.number().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  tags: z.array(z.string()).optional(),
  activityLevel: z.enum(['low', 'medium', 'high']).optional(),
  includePrivate: z.boolean().optional(),
  status: z.enum(['active', 'inactive', 'archived']).optional(),
  page: z.number().int().positive().optional(),
  limit: z.number().int().positive().max(100).optional(),
});

export type GroupSearchParams = z.infer<typeof groupSearchSchema>; 