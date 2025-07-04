"use strict";
/**
 * Club models and utilities
 * This file provides types and helper functions for working with sports clubs and their groups
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.clubSearchSchema = exports.DEFAULT_CLUB_ROLES = exports.clubRoleSchema = exports.ClubPermission = exports.clubGroupSchema = exports.clubSportSchema = exports.clubSchema = exports.clubSettingsSchema = exports.TEAM_LEVEL_LABELS = exports.TeamLevel = exports.TEAM_GENDER_LABELS = exports.TeamGender = exports.AGE_GROUP_LABELS = exports.AgeGroup = exports.SPORT_TYPE_ICONS = exports.SPORT_TYPE_LABELS = exports.SPORT_CATEGORIES = exports.SportType = void 0;
exports.generateTeamName = generateTeamName;
exports.sportHasAgeGroups = sportHasAgeGroups;
exports.sportHasGenderSeparation = sportHasGenderSeparation;
exports.suggestGroupStructure = suggestGroupStructure;
exports.getDefaultClubSettings = getDefaultClubSettings;
const zod_1 = require("zod");
// Sport type definitions
var SportType;
(function (SportType) {
    // Team sports
    SportType["FOOTBALL"] = "football";
    SportType["BASKETBALL"] = "basketball";
    SportType["VOLLEYBALL"] = "volleyball";
    SportType["HANDBALL"] = "handball";
    SportType["HOCKEY"] = "hockey";
    SportType["RUGBY"] = "rugby";
    SportType["CRICKET"] = "cricket";
    SportType["BASEBALL"] = "baseball";
    // Racket sports
    SportType["TENNIS"] = "tennis";
    SportType["BADMINTON"] = "badminton";
    SportType["SQUASH"] = "squash";
    SportType["TABLE_TENNIS"] = "table_tennis";
    SportType["PADEL"] = "padel";
    // Water sports
    SportType["SWIMMING"] = "swimming";
    SportType["WATER_POLO"] = "water_polo";
    SportType["ROWING"] = "rowing";
    SportType["SAILING"] = "sailing";
    SportType["SURFING"] = "surfing";
    SportType["DIVING"] = "diving";
    // Combat sports
    SportType["BOXING"] = "boxing";
    SportType["WRESTLING"] = "wrestling";
    SportType["JUDO"] = "judo";
    SportType["KARATE"] = "karate";
    SportType["TAEKWONDO"] = "taekwondo";
    // Athletic sports
    SportType["TRACK_FIELD"] = "track_field";
    SportType["GYMNASTICS"] = "gymnastics";
    SportType["CYCLING"] = "cycling";
    SportType["ATHLETICS"] = "athletics";
    // Winter sports
    SportType["SKIING"] = "skiing";
    SportType["SNOWBOARDING"] = "snowboarding";
    SportType["ICE_SKATING"] = "ice_skating";
    SportType["ICE_HOCKEY"] = "ice_hockey";
    // Other sports
    SportType["GOLF"] = "golf";
    SportType["CLIMBING"] = "climbing";
    SportType["DANCE"] = "dance";
    SportType["YOGA"] = "yoga";
    SportType["FITNESS"] = "fitness";
    SportType["CHESS"] = "chess";
    SportType["ESPORTS"] = "esports";
    // General category
    SportType["OTHER"] = "other";
})(SportType || (exports.SportType = SportType = {}));
// Sport categories for UI organization
exports.SPORT_CATEGORIES = {
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
exports.SPORT_TYPE_LABELS = {
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
exports.SPORT_TYPE_ICONS = {
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
var AgeGroup;
(function (AgeGroup) {
    AgeGroup["U6"] = "u6";
    AgeGroup["U8"] = "u8";
    AgeGroup["U10"] = "u10";
    AgeGroup["U12"] = "u12";
    AgeGroup["U14"] = "u14";
    AgeGroup["U16"] = "u16";
    AgeGroup["U18"] = "u18";
    AgeGroup["U21"] = "u21";
    AgeGroup["SENIOR"] = "senior";
    AgeGroup["MASTERS"] = "masters";
    AgeGroup["ALL_AGES"] = "all_ages";
})(AgeGroup || (exports.AgeGroup = AgeGroup = {}));
// Age group labels for UI display
exports.AGE_GROUP_LABELS = {
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
var TeamGender;
(function (TeamGender) {
    TeamGender["MALE"] = "male";
    TeamGender["FEMALE"] = "female";
    TeamGender["MIXED"] = "mixed";
})(TeamGender || (exports.TeamGender = TeamGender = {}));
// Gender labels for UI display
exports.TEAM_GENDER_LABELS = {
    [TeamGender.MALE]: 'Male',
    [TeamGender.FEMALE]: 'Female',
    [TeamGender.MIXED]: 'Mixed'
};
// Team level categories
var TeamLevel;
(function (TeamLevel) {
    TeamLevel["RECREATIONAL"] = "recreational";
    TeamLevel["BEGINNER"] = "beginner";
    TeamLevel["INTERMEDIATE"] = "intermediate";
    TeamLevel["ADVANCED"] = "advanced";
    TeamLevel["COMPETITIVE"] = "competitive";
    TeamLevel["ELITE"] = "elite";
})(TeamLevel || (exports.TeamLevel = TeamLevel = {}));
// Team level labels for UI display
exports.TEAM_LEVEL_LABELS = {
    [TeamLevel.RECREATIONAL]: 'Recreational',
    [TeamLevel.BEGINNER]: 'Beginner',
    [TeamLevel.INTERMEDIATE]: 'Intermediate',
    [TeamLevel.ADVANCED]: 'Advanced',
    [TeamLevel.COMPETITIVE]: 'Competitive',
    [TeamLevel.ELITE]: 'Elite'
};
// Helper function to generate a team name based on metadata
function generateTeamName(clubName, sportName, ageGroup, gender, level) {
    let teamName = `${clubName} ${sportName}`;
    // Add age group if specified
    if (ageGroup && ageGroup !== AgeGroup.ALL_AGES) {
        teamName += ` ${exports.AGE_GROUP_LABELS[ageGroup]}`;
    }
    // Add gender if specified and not mixed
    if (gender && gender !== TeamGender.MIXED) {
        teamName += ` ${exports.TEAM_GENDER_LABELS[gender]}`;
    }
    // Add level if competitive or elite
    if (level && (level === TeamLevel.COMPETITIVE || level === TeamLevel.ELITE)) {
        teamName += ` ${exports.TEAM_LEVEL_LABELS[level]}`;
    }
    return teamName;
}
// Helper function to check if a sport typically has age groups
function sportHasAgeGroups(sportType) {
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
function sportHasGenderSeparation(sportType) {
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
function suggestGroupStructure(sportType, clubSize) {
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
        }
        else if (clubSize === 'medium') {
            structure.ageGroups = [AgeGroup.U12, AgeGroup.U16, AgeGroup.U18, AgeGroup.SENIOR];
        }
        else { // large
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
    }
    else if (clubSize === 'medium') {
        structure.levels = [TeamLevel.RECREATIONAL, TeamLevel.INTERMEDIATE, TeamLevel.COMPETITIVE];
    }
    else { // large
        structure.levels = [
            TeamLevel.RECREATIONAL, TeamLevel.BEGINNER,
            TeamLevel.INTERMEDIATE, TeamLevel.ADVANCED,
            TeamLevel.COMPETITIVE, TeamLevel.ELITE
        ];
    }
    return structure;
}
// Get default club settings
function getDefaultClubSettings() {
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
exports.clubSettingsSchema = zod_1.z.object({
    allowPublicJoin: zod_1.z.boolean().default(true),
    allowGroupCreation: zod_1.z.boolean().default(true),
    requireLocationVerification: zod_1.z.boolean().default(false),
    requireMemberApproval: zod_1.z.boolean().default(false),
    privacyLevel: zod_1.z.enum(['public', 'listed', 'private']).default('public'),
    visibleEvents: zod_1.z.enum(['all', 'members', 'approved']).default('all'),
    visibleGroups: zod_1.z.enum(['all', 'members']).default('all'),
    // For backward compatibility with existing interface
    allowPublicGroups: zod_1.z.boolean().default(true),
    allowMembersToCreateGroups: zod_1.z.boolean().default(true),
    requireApprovalForEvents: zod_1.z.boolean().default(false),
    allowMembersToInvite: zod_1.z.boolean().default(true),
    showMemberList: zod_1.z.boolean().default(true),
    defaultMemberRole: zod_1.z.string().default('Member'),
    customTheme: zod_1.z.object({
        primaryColor: zod_1.z.string().optional(),
        secondaryColor: zod_1.z.string().optional(),
        logoUrl: zod_1.z.string().optional(),
    }).optional(),
});
/**
 * Club validation schema
 */
exports.clubSchema = zod_1.z.object({
    name: zod_1.z.string().min(2, 'Name must be at least 2 characters'),
    description: zod_1.z.string().optional(),
    logo: zod_1.z.string().url().optional(),
    coverImage: zod_1.z.string().url().optional(),
    website: zod_1.z.string().url().optional(),
    contactEmail: zod_1.z.string().email().optional(),
    contactPhone: zod_1.z.string().optional(),
    foundedYear: zod_1.z.number().int().positive().optional(),
    settings: exports.clubSettingsSchema.optional(),
    locations: zod_1.z.array(zod_1.z.string()).optional(), // Array of location IDs
    primaryLocationId: zod_1.z.string().optional(),
    sports: zod_1.z.array(zod_1.z.string()).optional(), // Array of sport names
});
/**
 * Club sport validation schema
 */
exports.clubSportSchema = zod_1.z.object({
    name: zod_1.z.string().min(2, 'Name must be at least 2 characters'),
    description: zod_1.z.string().optional(),
    sportType: zod_1.z.nativeEnum(SportType),
    icon: zod_1.z.string().optional(),
    color: zod_1.z.string().optional(),
});
/**
 * Club group validation schema
 */
exports.clubGroupSchema = zod_1.z.object({
    sportId: zod_1.z.string(),
    level: zod_1.z.nativeEnum(TeamLevel).optional(),
    ageGroup: zod_1.z.nativeEnum(AgeGroup).optional(),
    gender: zod_1.z.nativeEnum(TeamGender).optional(),
    isDefault: zod_1.z.boolean().optional(),
    // Group properties
    name: zod_1.z.string().min(2, 'Name must be at least 2 characters'),
    description: zod_1.z.string().optional(),
    image: zod_1.z.string().url().optional(),
    useGeneratedName: zod_1.z.boolean().optional(),
});
/**
 * Club role permissions
 */
var ClubPermission;
(function (ClubPermission) {
    // Management permissions
    ClubPermission["MANAGE_CLUB"] = "MANAGE_CLUB";
    ClubPermission["MANAGE_SETTINGS"] = "MANAGE_SETTINGS";
    ClubPermission["MANAGE_MEMBERS"] = "MANAGE_MEMBERS";
    ClubPermission["MANAGE_ROLES"] = "MANAGE_ROLES";
    ClubPermission["MANAGE_GROUPS"] = "MANAGE_GROUPS";
    ClubPermission["MANAGE_LOCATIONS"] = "MANAGE_LOCATIONS";
    ClubPermission["MANAGE_SPORTS"] = "MANAGE_SPORTS";
    ClubPermission["MANAGE_EVENTS"] = "MANAGE_EVENTS";
    // View permissions
    ClubPermission["VIEW_MEMBERS"] = "VIEW_MEMBERS";
    ClubPermission["VIEW_ANALYTICS"] = "VIEW_ANALYTICS";
    // Action permissions
    ClubPermission["CREATE_GROUP"] = "CREATE_GROUP";
    ClubPermission["CREATE_EVENT"] = "CREATE_EVENT";
    ClubPermission["CREATE_POST"] = "CREATE_POST";
    ClubPermission["INVITE_MEMBERS"] = "INVITE_MEMBERS";
})(ClubPermission || (exports.ClubPermission = ClubPermission = {}));
/**
 * Club role validation schema
 */
exports.clubRoleSchema = zod_1.z.object({
    name: zod_1.z.string().min(2, 'Name must be at least 2 characters'),
    description: zod_1.z.string().optional(),
    color: zod_1.z.string().optional(),
    permissions: zod_1.z.array(zod_1.z.nativeEnum(ClubPermission)),
    isDefault: zod_1.z.boolean().optional(),
    inheritToGroups: zod_1.z.boolean().optional(),
});
/**
 * Default club roles
 */
exports.DEFAULT_CLUB_ROLES = [
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
exports.clubSearchSchema = zod_1.z.object({
    query: zod_1.z.string().optional(),
    sport: zod_1.z.string().optional(),
    locationId: zod_1.z.string().optional(),
    page: zod_1.z.number().int().positive().optional(),
    limit: zod_1.z.number().int().positive().max(100).optional(),
});
