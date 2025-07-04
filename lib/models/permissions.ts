/**
 * Permission models and utilities for groups and clubs
 * This file provides types and helper functions for working with permissions
 */

// Group permission types
export enum GroupPermission {
  // Management permissions
  MANAGE_GROUP = 'manage_group',
  MANAGE_MEMBERS = 'manage_members',
  MANAGE_ROLES = 'manage_roles',
  MANAGE_EVENTS = 'manage_events',
  MANAGE_CONTENT = 'manage_content',
  
  // View permissions
  VIEW_MEMBERS = 'view_members',
  VIEW_ANALYTICS = 'view_analytics',
  
  // Action permissions
  CREATE_POSTS = 'create_posts',
  CREATE_EVENTS = 'create_events',
  JOIN_EVENTS = 'join_events',
  INVITE_MEMBERS = 'invite_members',
  MODERATE_CONTENT = 'moderate_content',
  
  // Basic permissions
  VIEW_GROUP = 'view_group',
  VIEW_EVENTS = 'view_events'
}

// Club permission types
export enum ClubPermission {
  // Management permissions
  MANAGE_CLUB = 'manage_club',
  MANAGE_MEMBERS = 'manage_members',
  MANAGE_ROLES = 'manage_roles',
  MANAGE_GROUPS = 'manage_groups',
  MANAGE_SPORTS = 'manage_sports',
  MANAGE_LOCATIONS = 'manage_locations',
  MANAGE_EVENTS = 'manage_events',
  MANAGE_CONTENT = 'manage_content',
  
  // View permissions
  VIEW_MEMBERS = 'view_members',
  VIEW_ANALYTICS = 'view_analytics',
  
  // Action permissions
  CREATE_POSTS = 'create_posts',
  CREATE_EVENTS = 'create_events',
  JOIN_EVENTS = 'join_events',
  INVITE_MEMBERS = 'invite_members',
  MODERATE_CONTENT = 'moderate_content',
  
  // Basic permissions
  VIEW_CLUB = 'view_club',
  VIEW_GROUPS = 'view_groups',
  VIEW_EVENTS = 'view_events'
}

// Permission categories for UI organization
export const GROUP_PERMISSION_CATEGORIES = {
  MANAGEMENT: [
    GroupPermission.MANAGE_GROUP,
    GroupPermission.MANAGE_MEMBERS,
    GroupPermission.MANAGE_ROLES,
    GroupPermission.MANAGE_EVENTS,
    GroupPermission.MANAGE_CONTENT
  ],
  VIEWING: [
    GroupPermission.VIEW_MEMBERS,
    GroupPermission.VIEW_ANALYTICS,
    GroupPermission.VIEW_GROUP,
    GroupPermission.VIEW_EVENTS
  ],
  ACTIONS: [
    GroupPermission.CREATE_POSTS,
    GroupPermission.CREATE_EVENTS,
    GroupPermission.JOIN_EVENTS,
    GroupPermission.INVITE_MEMBERS,
    GroupPermission.MODERATE_CONTENT
  ]
};

export const CLUB_PERMISSION_CATEGORIES = {
  MANAGEMENT: [
    ClubPermission.MANAGE_CLUB,
    ClubPermission.MANAGE_MEMBERS,
    ClubPermission.MANAGE_ROLES,
    ClubPermission.MANAGE_GROUPS,
    ClubPermission.MANAGE_SPORTS,
    ClubPermission.MANAGE_LOCATIONS,
    ClubPermission.MANAGE_EVENTS,
    ClubPermission.MANAGE_CONTENT
  ],
  VIEWING: [
    ClubPermission.VIEW_MEMBERS,
    ClubPermission.VIEW_ANALYTICS,
    ClubPermission.VIEW_CLUB,
    ClubPermission.VIEW_GROUPS,
    ClubPermission.VIEW_EVENTS
  ],
  ACTIONS: [
    ClubPermission.CREATE_POSTS,
    ClubPermission.CREATE_EVENTS,
    ClubPermission.JOIN_EVENTS,
    ClubPermission.INVITE_MEMBERS,
    ClubPermission.MODERATE_CONTENT
  ]
};

// Permission labels for UI display
export const GROUP_PERMISSION_LABELS: Record<GroupPermission, string> = {
  [GroupPermission.MANAGE_GROUP]: 'Manage Group Settings',
  [GroupPermission.MANAGE_MEMBERS]: 'Manage Members',
  [GroupPermission.MANAGE_ROLES]: 'Manage Roles',
  [GroupPermission.MANAGE_EVENTS]: 'Manage Events',
  [GroupPermission.MANAGE_CONTENT]: 'Manage Content',
  [GroupPermission.VIEW_MEMBERS]: 'View Member List',
  [GroupPermission.VIEW_ANALYTICS]: 'View Analytics',
  [GroupPermission.CREATE_POSTS]: 'Create Posts',
  [GroupPermission.CREATE_EVENTS]: 'Create Events',
  [GroupPermission.JOIN_EVENTS]: 'Join Events',
  [GroupPermission.INVITE_MEMBERS]: 'Invite Members',
  [GroupPermission.MODERATE_CONTENT]: 'Moderate Content',
  [GroupPermission.VIEW_GROUP]: 'View Group',
  [GroupPermission.VIEW_EVENTS]: 'View Events'
};

export const CLUB_PERMISSION_LABELS: Record<ClubPermission, string> = {
  [ClubPermission.MANAGE_CLUB]: 'Manage Club Settings',
  [ClubPermission.MANAGE_MEMBERS]: 'Manage Members',
  [ClubPermission.MANAGE_ROLES]: 'Manage Roles',
  [ClubPermission.MANAGE_GROUPS]: 'Manage Groups',
  [ClubPermission.MANAGE_SPORTS]: 'Manage Sports',
  [ClubPermission.MANAGE_LOCATIONS]: 'Manage Locations',
  [ClubPermission.MANAGE_EVENTS]: 'Manage Events',
  [ClubPermission.MANAGE_CONTENT]: 'Manage Content',
  [ClubPermission.VIEW_MEMBERS]: 'View Member List',
  [ClubPermission.VIEW_ANALYTICS]: 'View Analytics',
  [ClubPermission.CREATE_POSTS]: 'Create Posts',
  [ClubPermission.CREATE_EVENTS]: 'Create Events',
  [ClubPermission.JOIN_EVENTS]: 'Join Events',
  [ClubPermission.INVITE_MEMBERS]: 'Invite Members',
  [ClubPermission.MODERATE_CONTENT]: 'Moderate Content',
  [ClubPermission.VIEW_CLUB]: 'View Club',
  [ClubPermission.VIEW_GROUPS]: 'View Groups',
  [ClubPermission.VIEW_EVENTS]: 'View Events'
};

// Permission descriptions for tooltips
export const GROUP_PERMISSION_DESCRIPTIONS: Record<GroupPermission, string> = {
  [GroupPermission.MANAGE_GROUP]: 'Change group settings, description, and appearance',
  [GroupPermission.MANAGE_MEMBERS]: 'Add, remove, and manage group members',
  [GroupPermission.MANAGE_ROLES]: 'Create, edit, and assign roles to members',
  [GroupPermission.MANAGE_EVENTS]: 'Create, edit, and cancel group events',
  [GroupPermission.MANAGE_CONTENT]: 'Edit or delete any content in the group',
  [GroupPermission.VIEW_MEMBERS]: 'See the full list of group members',
  [GroupPermission.VIEW_ANALYTICS]: 'View group statistics and engagement metrics',
  [GroupPermission.CREATE_POSTS]: 'Create new posts in the group',
  [GroupPermission.CREATE_EVENTS]: 'Create new events for the group',
  [GroupPermission.JOIN_EVENTS]: 'Join events created by the group',
  [GroupPermission.INVITE_MEMBERS]: 'Invite new people to join the group',
  [GroupPermission.MODERATE_CONTENT]: 'Review and moderate member content',
  [GroupPermission.VIEW_GROUP]: 'Access the group and view its content',
  [GroupPermission.VIEW_EVENTS]: 'View events organized by the group'
};

export const CLUB_PERMISSION_DESCRIPTIONS: Record<ClubPermission, string> = {
  [ClubPermission.MANAGE_CLUB]: 'Change club settings, description, and appearance',
  [ClubPermission.MANAGE_MEMBERS]: 'Add, remove, and manage club members',
  [ClubPermission.MANAGE_ROLES]: 'Create, edit, and assign roles to members',
  [ClubPermission.MANAGE_GROUPS]: 'Create and manage groups within the club',
  [ClubPermission.MANAGE_SPORTS]: 'Add, edit, and remove sports offerings',
  [ClubPermission.MANAGE_LOCATIONS]: 'Add and manage club locations',
  [ClubPermission.MANAGE_EVENTS]: 'Create, edit, and cancel club events',
  [ClubPermission.MANAGE_CONTENT]: 'Edit or delete any content in the club',
  [ClubPermission.VIEW_MEMBERS]: 'See the full list of club members',
  [ClubPermission.VIEW_ANALYTICS]: 'View club statistics and engagement metrics',
  [ClubPermission.CREATE_POSTS]: 'Create new posts in the club',
  [ClubPermission.CREATE_EVENTS]: 'Create new events for the club',
  [ClubPermission.JOIN_EVENTS]: 'Join events created by the club',
  [ClubPermission.INVITE_MEMBERS]: 'Invite new people to join the club',
  [ClubPermission.MODERATE_CONTENT]: 'Review and moderate member content',
  [ClubPermission.VIEW_CLUB]: 'Access the club and view its content',
  [ClubPermission.VIEW_GROUPS]: 'View groups within the club',
  [ClubPermission.VIEW_EVENTS]: 'View events organized by the club'
};

// Default roles with pre-defined permissions
export const DEFAULT_GROUP_ROLES = {
  ADMIN: {
    name: 'Admin',
    description: 'Full administrative access to the group',
    permissions: [
      GroupPermission.MANAGE_GROUP,
      GroupPermission.MANAGE_MEMBERS,
      GroupPermission.MANAGE_ROLES,
      GroupPermission.MANAGE_EVENTS,
      GroupPermission.MANAGE_CONTENT,
      GroupPermission.VIEW_MEMBERS,
      GroupPermission.VIEW_ANALYTICS,
      GroupPermission.CREATE_POSTS,
      GroupPermission.CREATE_EVENTS,
      GroupPermission.JOIN_EVENTS,
      GroupPermission.INVITE_MEMBERS,
      GroupPermission.MODERATE_CONTENT,
      GroupPermission.VIEW_GROUP,
      GroupPermission.VIEW_EVENTS
    ]
  },
  MODERATOR: {
    name: 'Moderator',
    description: 'Can manage content and events',
    permissions: [
      GroupPermission.MANAGE_EVENTS,
      GroupPermission.MANAGE_CONTENT,
      GroupPermission.VIEW_MEMBERS,
      GroupPermission.CREATE_POSTS,
      GroupPermission.CREATE_EVENTS,
      GroupPermission.JOIN_EVENTS,
      GroupPermission.INVITE_MEMBERS,
      GroupPermission.MODERATE_CONTENT,
      GroupPermission.VIEW_GROUP,
      GroupPermission.VIEW_EVENTS
    ]
  },
  MEMBER: {
    name: 'Member',
    description: 'Regular group member',
    permissions: [
      GroupPermission.VIEW_EVENTS,
      GroupPermission.JOIN_EVENTS,
      GroupPermission.CREATE_POSTS,
      GroupPermission.VIEW_GROUP
    ]
  }
};

export const DEFAULT_CLUB_ROLES = {
  ADMIN: {
    name: 'Admin',
    description: 'Full administrative access to the club',
    permissions: [
      ClubPermission.MANAGE_CLUB,
      ClubPermission.MANAGE_MEMBERS,
      ClubPermission.MANAGE_ROLES,
      ClubPermission.MANAGE_GROUPS,
      ClubPermission.MANAGE_SPORTS,
      ClubPermission.MANAGE_LOCATIONS,
      ClubPermission.MANAGE_EVENTS,
      ClubPermission.MANAGE_CONTENT,
      ClubPermission.VIEW_MEMBERS,
      ClubPermission.VIEW_ANALYTICS,
      ClubPermission.CREATE_POSTS,
      ClubPermission.CREATE_EVENTS,
      ClubPermission.JOIN_EVENTS,
      ClubPermission.INVITE_MEMBERS,
      ClubPermission.MODERATE_CONTENT,
      ClubPermission.VIEW_CLUB,
      ClubPermission.VIEW_GROUPS,
      ClubPermission.VIEW_EVENTS
    ],
    inheritToGroups: true
  },
  COACH: {
    name: 'Coach',
    description: 'Can manage groups and events',
    permissions: [
      ClubPermission.MANAGE_GROUPS,
      ClubPermission.MANAGE_EVENTS,
      ClubPermission.VIEW_MEMBERS,
      ClubPermission.VIEW_ANALYTICS,
      ClubPermission.CREATE_POSTS,
      ClubPermission.CREATE_EVENTS,
      ClubPermission.JOIN_EVENTS,
      ClubPermission.INVITE_MEMBERS,
      ClubPermission.VIEW_CLUB,
      ClubPermission.VIEW_GROUPS,
      ClubPermission.VIEW_EVENTS
    ],
    inheritToGroups: true
  },
  MEMBER: {
    name: 'Member',
    description: 'Regular club member',
    permissions: [
      ClubPermission.VIEW_GROUPS,
      ClubPermission.JOIN_EVENTS,
      ClubPermission.VIEW_CLUB,
      ClubPermission.VIEW_EVENTS
    ],
    inheritToGroups: false
  }
};

// Type for user permissions
export interface UserPermissions {
  group?: {
    [groupId: string]: string[]; // Group ID to permissions array
  };
  club?: {
    [clubId: string]: string[]; // Club ID to permissions array
  };
}

// Helper functions to check permissions
export function hasGroupPermission(
  userPermissions: UserPermissions,
  groupId: string,
  permission: GroupPermission
): boolean {
  if (!userPermissions?.group?.[groupId]) return false;
  
  // Check for explicit permission
  if (userPermissions.group[groupId].includes(permission)) return true;
  
  // Check for management permission, which implies all other permissions
  if (permission !== GroupPermission.MANAGE_GROUP && 
      userPermissions.group[groupId].includes(GroupPermission.MANAGE_GROUP)) {
    return true;
  }
  
  return false;
}

export function hasClubPermission(
  userPermissions: UserPermissions,
  clubId: string,
  permission: ClubPermission
): boolean {
  if (!userPermissions?.club?.[clubId]) return false;
  
  // Check for explicit permission
  if (userPermissions.club[clubId].includes(permission)) return true;
  
  // Check for management permission, which implies all other permissions
  if (permission !== ClubPermission.MANAGE_CLUB && 
      userPermissions.club[clubId].includes(ClubPermission.MANAGE_CLUB)) {
    return true;
  }
  
  return false;
}

// Function to map club role permissions to group permissions
export function mapClubToGroupPermissions(
  permissions: string[],
  inheritToGroups: boolean
): string[] {
  if (!inheritToGroups) return [];
  
  const groupPermissions: string[] = [];
  
  // Map club permissions to equivalent group permissions
  if (permissions.includes(ClubPermission.MANAGE_CLUB)) {
    groupPermissions.push(GroupPermission.MANAGE_GROUP);
  }
  
  if (permissions.includes(ClubPermission.MANAGE_MEMBERS)) {
    groupPermissions.push(GroupPermission.MANAGE_MEMBERS);
  }
  
  if (permissions.includes(ClubPermission.MANAGE_ROLES)) {
    groupPermissions.push(GroupPermission.MANAGE_ROLES);
  }
  
  if (permissions.includes(ClubPermission.MANAGE_EVENTS)) {
    groupPermissions.push(GroupPermission.MANAGE_EVENTS);
  }
  
  if (permissions.includes(ClubPermission.MANAGE_CONTENT)) {
    groupPermissions.push(GroupPermission.MANAGE_CONTENT);
  }
  
  if (permissions.includes(ClubPermission.VIEW_MEMBERS)) {
    groupPermissions.push(GroupPermission.VIEW_MEMBERS);
  }
  
  if (permissions.includes(ClubPermission.VIEW_ANALYTICS)) {
    groupPermissions.push(GroupPermission.VIEW_ANALYTICS);
  }
  
  if (permissions.includes(ClubPermission.CREATE_POSTS)) {
    groupPermissions.push(GroupPermission.CREATE_POSTS);
  }
  
  if (permissions.includes(ClubPermission.CREATE_EVENTS)) {
    groupPermissions.push(GroupPermission.CREATE_EVENTS);
  }
  
  if (permissions.includes(ClubPermission.JOIN_EVENTS)) {
    groupPermissions.push(GroupPermission.JOIN_EVENTS);
  }
  
  if (permissions.includes(ClubPermission.INVITE_MEMBERS)) {
    groupPermissions.push(GroupPermission.INVITE_MEMBERS);
  }
  
  if (permissions.includes(ClubPermission.MODERATE_CONTENT)) {
    groupPermissions.push(GroupPermission.MODERATE_CONTENT);
  }
  
  if (permissions.includes(ClubPermission.VIEW_GROUPS)) {
    groupPermissions.push(GroupPermission.VIEW_GROUP);
  }
  
  if (permissions.includes(ClubPermission.VIEW_EVENTS)) {
    groupPermissions.push(GroupPermission.VIEW_EVENTS);
  }
  
  return groupPermissions;
} 