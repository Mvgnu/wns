/**
 * Club models and utilities
 * This file provides types and helper functions for working with sports clubs and their groups
 */

import { z } from 'zod';

// Sport type definitions
export enum SportType {
  // Team sports
  FOOTBALL = 'football',
  BASKETBALL = 'basketball',
  VOLLEYBALL = 'volleyball',
  HANDBALL = 'handball',
  HOCKEY = 'hockey',
  RUGBY = 'rugby',
  CRICKET = 'cricket',
  BASEBALL = 'baseball',
  
  // Racket sports
  TENNIS = 'tennis',
  BADMINTON = 'badminton',
  SQUASH = 'squash',
  TABLE_TENNIS = 'table_tennis',
  PADEL = 'padel',
  
  // Water sports
  SWIMMING = 'swimming',
  WATER_POLO = 'water_polo',
  ROWING = 'rowing',
  SAILING = 'sailing',
  SURFING = 'surfing',
  DIVING = 'diving',
  
  // Combat sports
  BOXING = 'boxing',
  WRESTLING = 'wrestling',
  JUDO = 'judo',
  KARATE = 'karate',
  TAEKWONDO = 'taekwondo',
  
  // Athletic sports
  TRACK_FIELD = 'track_field',
  GYMNASTICS = 'gymnastics',
  CYCLING = 'cycling',
  ATHLETICS = 'athletics',
  
  // Winter sports
  SKIING = 'skiing',
  SNOWBOARDING = 'snowboarding',
  ICE_SKATING = 'ice_skating',
  ICE_HOCKEY = 'ice_hockey',
  
  // Other sports
  GOLF = 'golf',
  CLIMBING = 'climbing',
  DANCE = 'dance',
  YOGA = 'yoga',
  FITNESS = 'fitness',
  CHESS = 'chess',
  ESPORTS = 'esports',
  
  // General category
  OTHER = 'other'
}

// Sport categories for UI organization
export const SPORT_CATEGORIES = {
  TEAM_SPORTS: [
    SportType.FOOTBALL,
    SportType.BASKETBALL,
    SportType.VOLLEYBALL,
    SportType.HANDBALL,
    SportType.HOCKEY,
    SportType.RUGBY,
    SportType.CRICKET,
    SportType.BASEBALL
  ],
  RACKET_SPORTS: [
    SportType.TENNIS,
    SportType.BADMINTON,
    SportType.SQUASH,
    SportType.TABLE_TENNIS,
    SportType.PADEL
  ],
  WATER_SPORTS: [
    SportType.SWIMMING,
    SportType.WATER_POLO,
    SportType.ROWING,
    SportType.SAILING,
    SportType.SURFING,
    SportType.DIVING
  ],
  COMBAT_SPORTS: [
    SportType.BOXING,
    SportType.WRESTLING,
    SportType.JUDO,
    SportType.KARATE,
    SportType.TAEKWONDO
  ],
  ATHLETIC_SPORTS: [
    SportType.TRACK_FIELD,
    SportType.GYMNASTICS,
    SportType.CYCLING,
    SportType.ATHLETICS
  ],
  WINTER_SPORTS: [
    SportType.SKIING,
    SportType.SNOWBOARDING,
    SportType.ICE_SKATING,
    SportType.ICE_HOCKEY
  ],
  OTHER_SPORTS: [
    SportType.GOLF,
    SportType.CLIMBING,
    SportType.DANCE,
    SportType.YOGA,
    SportType.FITNESS,
    SportType.CHESS,
    SportType.ESPORTS,
    SportType.OTHER
  ]
};

// Sport labels for UI display
export const SPORT_TYPE_LABELS: Record<SportType, string> = {
  [SportType.FOOTBALL]: 'Football/Soccer',
  [SportType.BASKETBALL]: 'Basketball',
  [SportType.VOLLEYBALL]: 'Volleyball',
  [SportType.HANDBALL]: 'Handball',
  [SportType.HOCKEY]: 'Hockey',
  [SportType.RUGBY]: 'Rugby',
  [SportType.CRICKET]: 'Cricket',
  [SportType.BASEBALL]: 'Baseball',
  [SportType.TENNIS]: 'Tennis',
  [SportType.BADMINTON]: 'Badminton',
  [SportType.SQUASH]: 'Squash',
  [SportType.TABLE_TENNIS]: 'Table Tennis',
  [SportType.PADEL]: 'Padel',
  [SportType.SWIMMING]: 'Swimming',
  [SportType.WATER_POLO]: 'Water Polo',
  [SportType.ROWING]: 'Rowing',
  [SportType.SAILING]: 'Sailing',
  [SportType.SURFING]: 'Surfing',
  [SportType.DIVING]: 'Diving',
  [SportType.BOXING]: 'Boxing',
  [SportType.WRESTLING]: 'Wrestling',
  [SportType.JUDO]: 'Judo',
  [SportType.KARATE]: 'Karate',
  [SportType.TAEKWONDO]: 'Taekwondo',
  [SportType.TRACK_FIELD]: 'Track & Field',
  [SportType.GYMNASTICS]: 'Gymnastics',
  [SportType.CYCLING]: 'Cycling',
  [SportType.ATHLETICS]: 'Athletics',
  [SportType.SKIING]: 'Skiing',
  [SportType.SNOWBOARDING]: 'Snowboarding',
  [SportType.ICE_SKATING]: 'Ice Skating',
  [SportType.ICE_HOCKEY]: 'Ice Hockey',
  [SportType.GOLF]: 'Golf',
  [SportType.CLIMBING]: 'Climbing',
  [SportType.DANCE]: 'Dance',
  [SportType.YOGA]: 'Yoga',
  [SportType.FITNESS]: 'Fitness',
  [SportType.CHESS]: 'Chess',
  [SportType.ESPORTS]: 'Esports',
  [SportType.OTHER]: 'Other'
};

// Sport icons for UI display (using common icon names that can be mapped to your icon library)
export const SPORT_TYPE_ICONS: Record<SportType, string> = {
  [SportType.FOOTBALL]: 'sports-soccer',
  [SportType.BASKETBALL]: 'sports-basketball',
  [SportType.VOLLEYBALL]: 'sports-volleyball',
  [SportType.HANDBALL]: 'sports-handball',
  [SportType.HOCKEY]: 'sports-hockey',
  [SportType.RUGBY]: 'sports-rugby',
  [SportType.CRICKET]: 'sports-cricket',
  [SportType.BASEBALL]: 'sports-baseball',
  [SportType.TENNIS]: 'sports-tennis',
  [SportType.BADMINTON]: 'sports-badminton',
  [SportType.SQUASH]: 'sports-tennis', // Using tennis as fallback
  [SportType.TABLE_TENNIS]: 'table-tennis',
  [SportType.PADEL]: 'sports-tennis', // Using tennis as fallback
  [SportType.SWIMMING]: 'pool',
  [SportType.WATER_POLO]: 'pool',
  [SportType.ROWING]: 'rowing',
  [SportType.SAILING]: 'sailing',
  [SportType.SURFING]: 'surfing',
  [SportType.DIVING]: 'scuba-diving',
  [SportType.BOXING]: 'sports-mma',
  [SportType.WRESTLING]: 'sports-kabaddi',
  [SportType.JUDO]: 'sports-martial-arts',
  [SportType.KARATE]: 'sports-martial-arts',
  [SportType.TAEKWONDO]: 'sports-martial-arts',
  [SportType.TRACK_FIELD]: 'directions-run',
  [SportType.GYMNASTICS]: 'sports-gymnastics',
  [SportType.CYCLING]: 'directions-bike',
  [SportType.ATHLETICS]: 'directions-run',
  [SportType.SKIING]: 'downhill-skiing',
  [SportType.SNOWBOARDING]: 'snowboarding',
  [SportType.ICE_SKATING]: 'ice-skating',
  [SportType.ICE_HOCKEY]: 'sports-hockey',
  [SportType.GOLF]: 'golf-course',
  [SportType.CLIMBING]: 'hiking',
  [SportType.DANCE]: 'music-note',
  [SportType.YOGA]: 'self-improvement',
  [SportType.FITNESS]: 'fitness-center',
  [SportType.CHESS]: 'chess',
  [SportType.ESPORTS]: 'sports-esports',
  [SportType.OTHER]: 'sports'
};

// Common age groups for sports teams
export enum AgeGroup {
  U6 = 'u6',
  U8 = 'u8',
  U10 = 'u10',
  U12 = 'u12',
  U14 = 'u14',
  U16 = 'u16',
  U18 = 'u18',
  U21 = 'u21',
  SENIOR = 'senior',
  MASTERS = 'masters',
  ALL_AGES = 'all_ages'
}

// Age group labels for UI display
export const AGE_GROUP_LABELS: Record<AgeGroup, string> = {
  [AgeGroup.U6]: 'Under 6',
  [AgeGroup.U8]: 'Under 8',
  [AgeGroup.U10]: 'Under 10',
  [AgeGroup.U12]: 'Under 12',
  [AgeGroup.U14]: 'Under 14',
  [AgeGroup.U16]: 'Under 16',
  [AgeGroup.U18]: 'Under 18',
  [AgeGroup.U21]: 'Under 21',
  [AgeGroup.SENIOR]: 'Senior',
  [AgeGroup.MASTERS]: 'Masters/Veterans',
  [AgeGroup.ALL_AGES]: 'All Ages'
};

// Gender categories for teams
export enum TeamGender {
  MALE = 'male',
  FEMALE = 'female',
  MIXED = 'mixed'
}

// Gender labels for UI display
export const TEAM_GENDER_LABELS: Record<TeamGender, string> = {
  [TeamGender.MALE]: 'Male',
  [TeamGender.FEMALE]: 'Female',
  [TeamGender.MIXED]: 'Mixed'
};

// Team level categories
export enum TeamLevel {
  RECREATIONAL = 'recreational',
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
  COMPETITIVE = 'competitive',
  ELITE = 'elite'
}

// Team level labels for UI display
export const TEAM_LEVEL_LABELS: Record<TeamLevel, string> = {
  [TeamLevel.RECREATIONAL]: 'Recreational',
  [TeamLevel.BEGINNER]: 'Beginner',
  [TeamLevel.INTERMEDIATE]: 'Intermediate',
  [TeamLevel.ADVANCED]: 'Advanced',
  [TeamLevel.COMPETITIVE]: 'Competitive',
  [TeamLevel.ELITE]: 'Elite'
};

// Club sports data interface
export interface ClubSport {
  id: string;
  clubId: string;
  sportType: SportType;
  name: string;
  description?: string;
  imageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Club location data interface
export interface ClubLocation {
  id: string;
  clubId: string;
  locationId: string;
  isPrimary: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Club group data interface
export interface ClubGroup {
  id: string;
  clubId: string;
  groupId: string;
  sportId: string;
  ageGroup?: AgeGroup;
  gender?: TeamGender;
  level?: TeamLevel;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Helper function to generate a team name based on metadata
export function generateTeamName(
  clubName: string,
  sportName: string,
  ageGroup?: AgeGroup,
  gender?: TeamGender,
  level?: TeamLevel
): string {
  let teamName = `${clubName} ${sportName}`;
  
  // Add age group if specified
  if (ageGroup && ageGroup !== AgeGroup.ALL_AGES) {
    teamName += ` ${AGE_GROUP_LABELS[ageGroup]}`;
  }
  
  // Add gender if specified and not mixed
  if (gender && gender !== TeamGender.MIXED) {
    teamName += ` ${TEAM_GENDER_LABELS[gender]}`;
  }
  
  // Add level if competitive or elite
  if (level && (level === TeamLevel.COMPETITIVE || level === TeamLevel.ELITE)) {
    teamName += ` ${TEAM_LEVEL_LABELS[level]}`;
  }
  
  return teamName;
}

// Helper function to check if a sport typically has age groups
export function sportHasAgeGroups(sportType: SportType): boolean {
  // Sports that typically organize by age groups
  const ageGroupSports = [
    SportType.FOOTBALL,
    SportType.BASKETBALL,
    SportType.VOLLEYBALL,
    SportType.HANDBALL,
    SportType.HOCKEY,
    SportType.RUGBY,
    SportType.CRICKET,
    SportType.BASEBALL,
    SportType.SWIMMING,
    SportType.GYMNASTICS,
    SportType.ATHLETICS,
    SportType.ICE_HOCKEY
  ];
  
  return ageGroupSports.includes(sportType);
}

// Helper function to check if a sport is typically separated by gender
export function sportHasGenderSeparation(sportType: SportType): boolean {
  // These sports often have separate teams for different genders
  const genderSeparatedSports = [
    SportType.FOOTBALL,
    SportType.BASKETBALL,
    SportType.VOLLEYBALL,
    SportType.HANDBALL,
    SportType.HOCKEY,
    SportType.RUGBY,
    SportType.CRICKET,
    SportType.BASEBALL,
    SportType.SWIMMING,
    SportType.WATER_POLO,
    SportType.BOXING,
    SportType.WRESTLING,
    SportType.TRACK_FIELD,
    SportType.ATHLETICS,
    SportType.ICE_HOCKEY
  ];
  
  return genderSeparatedSports.includes(sportType);
}

// Helper function to suggest group structure for a club sport
export function suggestGroupStructure(
  sportType: SportType,
  clubSize: 'small' | 'medium' | 'large'
): { ageGroups: AgeGroup[], genders: TeamGender[], levels: TeamLevel[] } {
  // Default structure
  const structure = {
    ageGroups: [AgeGroup.ALL_AGES],
    genders: [TeamGender.MIXED],
    levels: [TeamLevel.RECREATIONAL]
  };
  
  // If the sport typically organizes by age groups
  if (sportHasAgeGroups(sportType)) {
    if (clubSize === 'small') {
      structure.ageGroups = [AgeGroup.U18, AgeGroup.SENIOR];
    } else if (clubSize === 'medium') {
      structure.ageGroups = [AgeGroup.U12, AgeGroup.U16, AgeGroup.U18, AgeGroup.SENIOR];
    } else { // large
      structure.ageGroups = [
        AgeGroup.U8, AgeGroup.U10, AgeGroup.U12, 
        AgeGroup.U14, AgeGroup.U16, AgeGroup.U18, 
        AgeGroup.U21, AgeGroup.SENIOR, AgeGroup.MASTERS
      ];
    }
  }
  
  // If the sport typically separates by gender
  if (sportHasGenderSeparation(sportType)) {
    structure.genders = [TeamGender.MALE, TeamGender.FEMALE];
    
    // Some sports might still have mixed teams in younger age groups
    if (clubSize === 'large' && structure.ageGroups.includes(AgeGroup.U8)) {
      structure.genders.push(TeamGender.MIXED);
    }
  }
  
  // Levels based on club size
  if (clubSize === 'small') {
    structure.levels = [TeamLevel.RECREATIONAL, TeamLevel.INTERMEDIATE];
  } else if (clubSize === 'medium') {
    structure.levels = [TeamLevel.RECREATIONAL, TeamLevel.INTERMEDIATE, TeamLevel.COMPETITIVE];
  } else { // large
    structure.levels = [
      TeamLevel.RECREATIONAL, TeamLevel.BEGINNER, 
      TeamLevel.INTERMEDIATE, TeamLevel.ADVANCED,
      TeamLevel.COMPETITIVE, TeamLevel.ELITE
    ];
  }
  
  return structure;
}

// Interface for club settings
export interface ClubSettings {
  allowPublicGroups: boolean;
  allowMembersToCreateGroups: boolean;
  requireApprovalForEvents: boolean;
  allowMembersToInvite: boolean;
  showMemberList: boolean;
  defaultMemberRole: string;
  customTheme?: {
    primaryColor?: string;
    secondaryColor?: string;
    logoUrl?: string;
  };
}

// Get default club settings
export function getDefaultClubSettings(): ClubSettings {
  return {
    allowPublicGroups: true,
    allowMembersToCreateGroups: false,
    requireApprovalForEvents: true,
    allowMembersToInvite: true,
    showMemberList: true,
    defaultMemberRole: 'member'
  };
}

/**
 * Club settings validation schema
 */
export const clubSettingsSchema = z.object({
  allowPublicJoin: z.boolean().default(true),
  allowGroupCreation: z.boolean().default(true),
  requireLocationVerification: z.boolean().default(false),
  requireMemberApproval: z.boolean().default(false),
  privacyLevel: z.enum(['public', 'listed', 'private']).default('public'),
  visibleEvents: z.enum(['all', 'members', 'approved']).default('all'),
  visibleGroups: z.enum(['all', 'members']).default('all'),
  // For backward compatibility with existing interface
  allowPublicGroups: z.boolean().default(true),
  allowMembersToCreateGroups: z.boolean().default(true),
  requireApprovalForEvents: z.boolean().default(false),
  allowMembersToInvite: z.boolean().default(true),
  showMemberList: z.boolean().default(true),
  defaultMemberRole: z.string().default('Member'),
  customTheme: z.object({
    primaryColor: z.string().optional(),
    secondaryColor: z.string().optional(),
    logoUrl: z.string().optional(),
  }).optional(),
});

/**
 * Club validation schema
 */
export const clubSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().optional(),
  logo: z.string().url().optional(),
  coverImage: z.string().url().optional(),
  website: z.string().url().optional(),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().optional(),
  foundedYear: z.number().int().positive().optional(),
  settings: clubSettingsSchema.optional(),
  locations: z.array(z.string()).optional(), // Array of location IDs
  primaryLocationId: z.string().optional(),
  sports: z.array(z.string()).optional(), // Array of sport names
});

export type ClubData = z.infer<typeof clubSchema>;

/**
 * Club sport validation schema 
 */
export const clubSportSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().optional(),
  sportType: z.nativeEnum(SportType),
  icon: z.string().optional(),
  color: z.string().optional(),
});

export type ClubSportData = z.infer<typeof clubSportSchema>;

/**
 * Club group validation schema
 */
export const clubGroupSchema = z.object({
  sportId: z.string(),
  level: z.nativeEnum(TeamLevel).optional(),
  ageGroup: z.nativeEnum(AgeGroup).optional(),
  gender: z.nativeEnum(TeamGender).optional(),
  isDefault: z.boolean().optional(),
  // Group properties
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().optional(),
  image: z.string().url().optional(),
  useGeneratedName: z.boolean().optional(),
});

export type ClubGroupData = z.infer<typeof clubGroupSchema>;

/**
 * Club role permissions
 */
export enum ClubPermission {
  // Management permissions
  MANAGE_CLUB = 'MANAGE_CLUB',
  MANAGE_SETTINGS = 'MANAGE_SETTINGS',
  MANAGE_MEMBERS = 'MANAGE_MEMBERS',
  MANAGE_ROLES = 'MANAGE_ROLES',
  MANAGE_GROUPS = 'MANAGE_GROUPS',
  MANAGE_LOCATIONS = 'MANAGE_LOCATIONS',
  MANAGE_SPORTS = 'MANAGE_SPORTS',
  MANAGE_EVENTS = 'MANAGE_EVENTS',
  
  // View permissions
  VIEW_MEMBERS = 'VIEW_MEMBERS',
  VIEW_ANALYTICS = 'VIEW_ANALYTICS',
  
  // Action permissions
  CREATE_GROUP = 'CREATE_GROUP',
  CREATE_EVENT = 'CREATE_EVENT',
  CREATE_POST = 'CREATE_POST',
  INVITE_MEMBERS = 'INVITE_MEMBERS',
}

/**
 * Club role validation schema
 */
export const clubRoleSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().optional(),
  color: z.string().optional(),
  permissions: z.array(z.nativeEnum(ClubPermission)),
  isDefault: z.boolean().optional(),
  inheritToGroups: z.boolean().optional(),
});

export type ClubRoleData = z.infer<typeof clubRoleSchema>;

/**
 * Default club roles
 */
export const DEFAULT_CLUB_ROLES: ClubRoleData[] = [
  {
    name: 'Admin',
    description: 'Full administrative control of the club',
    color: '#F43F5E', // Rose-500
    permissions: Object.values(ClubPermission),
    isDefault: false,
    inheritToGroups: true,
  },
  {
    name: 'Manager',
    description: 'Can manage most aspects of the club',
    color: '#3B82F6', // Blue-500
    permissions: [
      ClubPermission.MANAGE_MEMBERS,
      ClubPermission.MANAGE_GROUPS,
      ClubPermission.MANAGE_EVENTS,
      ClubPermission.VIEW_MEMBERS,
      ClubPermission.VIEW_ANALYTICS,
      ClubPermission.CREATE_GROUP,
      ClubPermission.CREATE_EVENT,
      ClubPermission.CREATE_POST,
      ClubPermission.INVITE_MEMBERS,
    ],
    isDefault: false,
    inheritToGroups: true,
  },
  {
    name: 'Coach',
    description: 'Can manage groups and events',
    color: '#10B981', // Emerald-500
    permissions: [
      ClubPermission.MANAGE_GROUPS,
      ClubPermission.MANAGE_EVENTS,
      ClubPermission.VIEW_MEMBERS,
      ClubPermission.CREATE_EVENT,
      ClubPermission.CREATE_POST,
      ClubPermission.INVITE_MEMBERS,
    ],
    isDefault: false,
    inheritToGroups: true,
  },
  {
    name: 'Member',
    description: 'Regular club member',
    color: '#6B7280', // Gray-500
    permissions: [
      ClubPermission.VIEW_MEMBERS,
      ClubPermission.CREATE_POST,
    ],
    isDefault: true,
    inheritToGroups: false,
  },
];

/**
 * Club search validation schema
 */
export const clubSearchSchema = z.object({
  query: z.string().optional(),
  sport: z.string().optional(),
  locationId: z.string().optional(),
  page: z.number().int().positive().optional(),
  limit: z.number().int().positive().max(100).optional(),
});

export type ClubSearchParams = z.infer<typeof clubSearchSchema>; 