"use strict";
/**
 * Group models and utilities
 * This file provides types and helper functions for working with groups and their members
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.groupSearchSchema = exports.groupMemberRoleSchema = exports.groupMemberStatusSchema = exports.DEFAULT_ZONED_GROUP_ROLES = exports.groupRoleSchema = exports.groupSchema = exports.groupSettingsSchema = exports.groupEntryRulesSchema = exports.MEMBERSHIP_STATUS_LABELS = exports.MembershipStatus = exports.GROUP_EVENTS_POLICY_DESCRIPTIONS = exports.GROUP_EVENTS_POLICY_LABELS = exports.GroupEventsPolicy = exports.GROUP_CONTENT_POLICY_DESCRIPTIONS = exports.GROUP_CONTENT_POLICY_LABELS = exports.GroupContentPolicy = exports.GROUP_JOIN_POLICY_DESCRIPTIONS = exports.GROUP_JOIN_POLICY_LABELS = exports.GroupJoinPolicy = exports.GROUP_VISIBILITY_DESCRIPTIONS = exports.GROUP_VISIBILITY_LABELS = exports.GroupVisibility = void 0;
exports.getDefaultGroupEntryRules = getDefaultGroupEntryRules;
exports.getDefaultGroupSettings = getDefaultGroupSettings;
exports.generateInvitationCode = generateInvitationCode;
exports.canPerformGroupAction = canPerformGroupAction;
exports.canManageGroupMember = canManageGroupMember;
const zod_1 = require("zod");
const permissions_1 = require("./permissions");
// Group Visibility enum
var GroupVisibility;
(function (GroupVisibility) {
    GroupVisibility["PUBLIC"] = "public";
    GroupVisibility["PRIVATE"] = "private";
    GroupVisibility["HIDDEN"] = "hidden"; // Only visible to members and invited users
})(GroupVisibility || (exports.GroupVisibility = GroupVisibility = {}));
// Group visibility labels for UI display
exports.GROUP_VISIBILITY_LABELS = {
    [GroupVisibility.PUBLIC]: 'Public',
    [GroupVisibility.PRIVATE]: 'Private',
    [GroupVisibility.HIDDEN]: 'Hidden'
};
// Group visibility descriptions for tooltips
exports.GROUP_VISIBILITY_DESCRIPTIONS = {
    [GroupVisibility.PUBLIC]: 'Anyone can find and view this group',
    [GroupVisibility.PRIVATE]: 'Anyone can find this group, but only members can view its content',
    [GroupVisibility.HIDDEN]: 'Only members and invited users can find and view this group'
};
// Group Join Policy enum
var GroupJoinPolicy;
(function (GroupJoinPolicy) {
    GroupJoinPolicy["OPEN"] = "open";
    GroupJoinPolicy["REQUEST"] = "request";
    GroupJoinPolicy["INVITE"] = "invite";
    GroupJoinPolicy["CODE"] = "code"; // Join using invitation code
})(GroupJoinPolicy || (exports.GroupJoinPolicy = GroupJoinPolicy = {}));
// Group join policy labels for UI display
exports.GROUP_JOIN_POLICY_LABELS = {
    [GroupJoinPolicy.OPEN]: 'Open to All',
    [GroupJoinPolicy.REQUEST]: 'Request to Join',
    [GroupJoinPolicy.INVITE]: 'Invitation Only',
    [GroupJoinPolicy.CODE]: 'Join with Code'
};
// Group join policy descriptions for tooltips
exports.GROUP_JOIN_POLICY_DESCRIPTIONS = {
    [GroupJoinPolicy.OPEN]: 'Anyone can join this group instantly without approval',
    [GroupJoinPolicy.REQUEST]: 'Anyone can request to join, but an admin or moderator needs to approve',
    [GroupJoinPolicy.INVITE]: 'Only people who receive a direct invitation can join',
    [GroupJoinPolicy.CODE]: 'People need an invitation code to join the group'
};
// Group Content Policy enum
var GroupContentPolicy;
(function (GroupContentPolicy) {
    GroupContentPolicy["ANYONE"] = "anyone";
    GroupContentPolicy["APPROVED"] = "approved";
    GroupContentPolicy["ADMINS_ONLY"] = "admins_only"; // Only admins and moderators can post
})(GroupContentPolicy || (exports.GroupContentPolicy = GroupContentPolicy = {}));
// Group content policy labels for UI display
exports.GROUP_CONTENT_POLICY_LABELS = {
    [GroupContentPolicy.ANYONE]: 'Anyone Can Post',
    [GroupContentPolicy.APPROVED]: 'Posts Need Approval',
    [GroupContentPolicy.ADMINS_ONLY]: 'Admins Only'
};
// Group content policy descriptions for tooltips
exports.GROUP_CONTENT_POLICY_DESCRIPTIONS = {
    [GroupContentPolicy.ANYONE]: 'Any member can post content to the group',
    [GroupContentPolicy.APPROVED]: 'Posts need to be approved by an admin or moderator',
    [GroupContentPolicy.ADMINS_ONLY]: 'Only admins and moderators can post content'
};
// Group Events Policy enum
var GroupEventsPolicy;
(function (GroupEventsPolicy) {
    GroupEventsPolicy["ANYONE"] = "anyone";
    GroupEventsPolicy["APPROVED"] = "approved";
    GroupEventsPolicy["ADMINS_ONLY"] = "admins_only"; // Only admins and moderators can create events
})(GroupEventsPolicy || (exports.GroupEventsPolicy = GroupEventsPolicy = {}));
// Group events policy labels for UI display
exports.GROUP_EVENTS_POLICY_LABELS = {
    [GroupEventsPolicy.ANYONE]: 'Anyone Can Create',
    [GroupEventsPolicy.APPROVED]: 'Events Need Approval',
    [GroupEventsPolicy.ADMINS_ONLY]: 'Admins Only'
};
// Group events policy descriptions for tooltips
exports.GROUP_EVENTS_POLICY_DESCRIPTIONS = {
    [GroupEventsPolicy.ANYONE]: 'Any member can create events for the group',
    [GroupEventsPolicy.APPROVED]: 'Events need to be approved by an admin or moderator',
    [GroupEventsPolicy.ADMINS_ONLY]: 'Only admins and moderators can create events'
};
// Group membership status enum
var MembershipStatus;
(function (MembershipStatus) {
    MembershipStatus["ACTIVE"] = "active";
    MembershipStatus["PENDING"] = "pending";
    MembershipStatus["INVITED"] = "invited";
    MembershipStatus["INACTIVE"] = "inactive";
    MembershipStatus["BANNED"] = "banned";
})(MembershipStatus || (exports.MembershipStatus = MembershipStatus = {}));
// Group membership status labels for UI display
exports.MEMBERSHIP_STATUS_LABELS = {
    [MembershipStatus.ACTIVE]: 'Active',
    [MembershipStatus.PENDING]: 'Pending Approval',
    [MembershipStatus.INVITED]: 'Invited',
    [MembershipStatus.INACTIVE]: 'Inactive',
    [MembershipStatus.BANNED]: 'Banned'
};
// Get default group entry rules
function getDefaultGroupEntryRules() {
    return {
        joinPolicy: GroupJoinPolicy.REQUEST,
        approvalRequired: true,
        requiresProfile: false
    };
}
// Get default group settings
function getDefaultGroupSettings() {
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
function generateInvitationCode() {
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
function canPerformGroupAction(action, userPermissions, groupId, groupSettings, memberStatus) {
    var _a, _b, _c, _d, _e, _f;
    // If no user or permissions, check public access only
    if (!userPermissions) {
        if (action === 'view') {
            return groupSettings.visibility === GroupVisibility.PUBLIC;
        }
        return false;
    }
    // Check if user has the MANAGE_GROUP permission, which grants all access
    if ((_b = (_a = userPermissions.group) === null || _a === void 0 ? void 0 : _a[groupId]) === null || _b === void 0 ? void 0 : _b.includes(permissions_1.GroupPermission.MANAGE_GROUP)) {
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
                    return ((_d = (_c = userPermissions.group) === null || _c === void 0 ? void 0 : _c[groupId]) === null || _d === void 0 ? void 0 : _d.includes(permissions_1.GroupPermission.MANAGE_CONTENT)) || false;
                }
                return true; // For ANYONE policy, all members can post
            case 'createEvent':
                if (groupSettings.eventsPolicy === GroupEventsPolicy.ADMINS_ONLY) {
                    return ((_f = (_e = userPermissions.group) === null || _e === void 0 ? void 0 : _e[groupId]) === null || _f === void 0 ? void 0 : _f.includes(permissions_1.GroupPermission.MANAGE_EVENTS)) || false;
                }
                return true; // For ANYONE policy, all members can create events
        }
    }
    // For non-members or non-active members
    if (action === 'view') {
        return groupSettings.visibility === GroupVisibility.PUBLIC;
    }
    else if (action === 'join') {
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
function canManageGroupMember(userPermissions, groupId, targetMemberRole, targetUserId, currentUserId) {
    var _a;
    // If no permissions, cannot manage
    if (!userPermissions || !((_a = userPermissions.group) === null || _a === void 0 ? void 0 : _a[groupId])) {
        return false;
    }
    // Cannot manage self (except for leaving)
    if (targetUserId === currentUserId) {
        return false;
    }
    // Check if user has manage members permission
    const canManageMembers = userPermissions.group[groupId].includes(permissions_1.GroupPermission.MANAGE_MEMBERS);
    // Check if user has manage group permission (admins)
    const isAdmin = userPermissions.group[groupId].includes(permissions_1.GroupPermission.MANAGE_GROUP);
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
exports.groupEntryRulesSchema = zod_1.z.object({
    requireApproval: zod_1.z.boolean().default(false),
    allowPublicJoin: zod_1.z.boolean().default(true),
    inviteOnly: zod_1.z.boolean().default(false),
    joinCode: zod_1.z.string().nullable().optional(),
    maxMembers: zod_1.z.number().int().positive().optional(),
});
// Group settings validation schema
exports.groupSettingsSchema = zod_1.z.object({
    allowMemberPosts: zod_1.z.boolean().default(true),
    allowMemberEvents: zod_1.z.boolean().default(false),
    visibility: zod_1.z.enum(['public', 'private', 'unlisted']).default('public'),
    contentModeration: zod_1.z.enum(['none', 'low', 'medium', 'high']).default('low'),
    notifyOnNewMembers: zod_1.z.boolean().default(true),
    notifyOnNewPosts: zod_1.z.boolean().default(true),
    notifyOnNewEvents: zod_1.z.boolean().default(true),
});
/**
 * Group validation schema
 */
exports.groupSchema = zod_1.z.object({
    name: zod_1.z.string().min(2, 'Name must be at least 2 characters'),
    description: zod_1.z.string().optional(),
    image: zod_1.z.string().url().optional(),
    sport: zod_1.z.string(),
    location: zod_1.z.string().optional(),
    isPrivate: zod_1.z.boolean().optional().default(false),
    entryRules: exports.groupEntryRulesSchema.optional(),
    settings: exports.groupSettingsSchema.optional(),
    // Enhanced location data
    latitude: zod_1.z.number().optional(),
    longitude: zod_1.z.number().optional(),
    locationName: zod_1.z.string().optional(),
    city: zod_1.z.string().optional(),
    state: zod_1.z.string().optional(),
    country: zod_1.z.string().optional(),
    zipCode: zod_1.z.string().optional(),
    // Group categorization
    groupTags: zod_1.z.array(zod_1.z.string()).optional(),
    activityLevel: zod_1.z.enum(['low', 'medium', 'high']).optional(),
    // New fields
    slug: zod_1.z.string().optional(),
    status: zod_1.z.enum(['active', 'inactive', 'archived']).default('active'),
});
/**
 * Group role validation schema
 */
exports.groupRoleSchema = zod_1.z.object({
    name: zod_1.z.string().min(2, 'Name must be at least 2 characters'),
    description: zod_1.z.string().optional(),
    color: zod_1.z.string().optional(),
    permissions: zod_1.z.array(zod_1.z.nativeEnum(permissions_1.GroupPermission)),
    isDefault: zod_1.z.boolean().optional(),
});
/**
 * Default group roles
 */
exports.DEFAULT_ZONED_GROUP_ROLES = [
    {
        name: 'Admin',
        description: 'Full administrative control of the group',
        color: '#F43F5E', // Rose-500
        permissions: Object.values(permissions_1.GroupPermission),
        isDefault: false,
    },
    {
        name: 'Moderator',
        description: 'Can manage members and content',
        color: '#3B82F6', // Blue-500
        permissions: [
            permissions_1.GroupPermission.MANAGE_MEMBERS,
            permissions_1.GroupPermission.VIEW_MEMBERS,
            permissions_1.GroupPermission.VIEW_ANALYTICS,
            permissions_1.GroupPermission.CREATE_EVENTS,
            permissions_1.GroupPermission.MANAGE_CONTENT,
            permissions_1.GroupPermission.MODERATE_CONTENT,
            permissions_1.GroupPermission.CREATE_POSTS,
            permissions_1.GroupPermission.INVITE_MEMBERS,
        ],
        isDefault: false,
    },
    {
        name: 'Member',
        description: 'Regular group member',
        color: '#6B7280', // Gray-500
        permissions: [
            permissions_1.GroupPermission.VIEW_MEMBERS,
            permissions_1.GroupPermission.CREATE_POSTS,
            permissions_1.GroupPermission.VIEW_GROUP,
            permissions_1.GroupPermission.VIEW_EVENTS,
        ],
        isDefault: true,
    },
];
/**
 * Group member status validation schema
 */
exports.groupMemberStatusSchema = zod_1.z.object({
    userId: zod_1.z.string(),
    status: zod_1.z.enum(['active', 'inactive', 'pending', 'banned']).default('active'),
    joinedAt: zod_1.z.date().optional(),
    invitedBy: zod_1.z.string().optional(),
    invitedAt: zod_1.z.date().optional(),
    lastActive: zod_1.z.date().optional(),
});
/**
 * Group member role validation schema
 */
exports.groupMemberRoleSchema = zod_1.z.object({
    userId: zod_1.z.string(),
    roleId: zod_1.z.string(),
    assignedBy: zod_1.z.string(),
});
/**
 * Group search validation schema
 */
exports.groupSearchSchema = zod_1.z.object({
    query: zod_1.z.string().optional(),
    sport: zod_1.z.string().optional(),
    location: zod_1.z.string().optional(),
    latitude: zod_1.z.number().optional(),
    longitude: zod_1.z.number().optional(),
    radius: zod_1.z.number().optional(),
    city: zod_1.z.string().optional(),
    state: zod_1.z.string().optional(),
    country: zod_1.z.string().optional(),
    tags: zod_1.z.array(zod_1.z.string()).optional(),
    activityLevel: zod_1.z.enum(['low', 'medium', 'high']).optional(),
    includePrivate: zod_1.z.boolean().optional(),
    status: zod_1.z.enum(['active', 'inactive', 'archived']).optional(),
    page: zod_1.z.number().int().positive().optional(),
    limit: zod_1.z.number().int().positive().max(100).optional(),
});
