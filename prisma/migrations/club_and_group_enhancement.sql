-- SQL Migration for Group, Club, and Place Type Enhancements
-- This script extends the schema to support:
-- 1. Enhanced place types (buildings, trails, spots)
-- 2. Group role and permission management
-- 3. Club structure with sports offerings and nested groups

-- Wrap everything in a transaction for atomicity
BEGIN;

-- Set error handling
\set ON_ERROR_STOP true

-- Function to log migration events
CREATE OR REPLACE FUNCTION log_migration_event(event_name text, details text) RETURNS void AS $$
BEGIN
    RAISE NOTICE 'MIGRATION EVENT: % - %', event_name, details;
END;
$$ LANGUAGE plpgsql;

-- Log migration start
SELECT log_migration_event('START', 'Beginning migration for Group and Club Enhancements');

-- Add place type enum if it doesn't exist
SELECT log_migration_event('MODIFY TABLE', 'Extending Place table with type field');

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'place_type') THEN
        CREATE TYPE place_type AS ENUM ('building', 'trail', 'spot');
    END IF;
EXCEPTION
    WHEN duplicate_object THEN 
        NULL;
END $$;

-- Alter Place table to add type field if it doesn't exist
ALTER TABLE "Location" 
    ADD COLUMN IF NOT EXISTS "type" place_type NOT NULL DEFAULT 'building';

-- Create index on place type for efficient filtering
CREATE INDEX IF NOT EXISTS "idx_location_type" ON "Location"("type");

-- Update Group table with enhanced entry rules and settings
SELECT log_migration_event('MODIFY TABLE', 'Enhancing Group table with entry rules and settings');

ALTER TABLE "Group"
    ADD COLUMN IF NOT EXISTS "entryRules" JSONB DEFAULT '{"requireApproval": false, "allowPublicJoin": true, "inviteOnly": false}',
    ADD COLUMN IF NOT EXISTS "settings" JSONB DEFAULT '{"allowMemberPosts": true, "allowMemberEvents": false, "visibility": "public"}';

-- Create GroupRole table for custom role management
SELECT log_migration_event('CREATE TABLE', 'Creating GroupRole table');

CREATE TABLE IF NOT EXISTS "GroupRole" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT,
    "permissions" TEXT[] NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "GroupRole_pkey" PRIMARY KEY ("id")
);

-- Create GroupMemberRole junction table
SELECT log_migration_event('CREATE TABLE', 'Creating GroupMemberRole table');

CREATE TABLE IF NOT EXISTS "GroupMemberRole" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "assignedBy" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "GroupMemberRole_pkey" PRIMARY KEY ("id")
);

-- Create Club table
SELECT log_migration_event('CREATE TABLE', 'Creating Club table');

CREATE TABLE IF NOT EXISTS "Club" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "logo" TEXT,
    "coverImage" TEXT,
    "website" TEXT,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "foundedYear" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'active',
    "settings" JSONB DEFAULT '{}',
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "Club_pkey" PRIMARY KEY ("id")
);

-- Create ClubLocation junction table (for multiple locations)
SELECT log_migration_event('CREATE TABLE', 'Creating ClubLocation table');

CREATE TABLE IF NOT EXISTS "ClubLocation" (
    "id" TEXT NOT NULL,
    "clubId" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "ClubLocation_pkey" PRIMARY KEY ("id")
);

-- Create ClubSport table
SELECT log_migration_event('CREATE TABLE', 'Creating ClubSport table');

CREATE TABLE IF NOT EXISTS "ClubSport" (
    "id" TEXT NOT NULL,
    "clubId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "color" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "ClubSport_pkey" PRIMARY KEY ("id")
);

-- Create ClubGroup table for groups within a sport
SELECT log_migration_event('CREATE TABLE', 'Creating ClubGroup table');

CREATE TABLE IF NOT EXISTS "ClubGroup" (
    "id" TEXT NOT NULL,
    "clubId" TEXT NOT NULL,
    "sportId" TEXT NOT NULL,
    "groupId" TEXT NOT NULL, -- References standard Group table
    "level" TEXT, -- e.g., "beginner", "intermediate", "advanced", "competitive"
    "ageRange" JSONB, -- e.g., {"min": 18, "max": 30}
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "ClubGroup_pkey" PRIMARY KEY ("id")
);

-- Create ClubRole table
SELECT log_migration_event('CREATE TABLE', 'Creating ClubRole table');

CREATE TABLE IF NOT EXISTS "ClubRole" (
    "id" TEXT NOT NULL,
    "clubId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT,
    "permissions" TEXT[] NOT NULL,
    "inheritToGroups" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "ClubRole_pkey" PRIMARY KEY ("id")
);

-- Create ClubMemberRole junction table
SELECT log_migration_event('CREATE TABLE', 'Creating ClubMemberRole table');

CREATE TABLE IF NOT EXISTS "ClubMemberRole" (
    "id" TEXT NOT NULL,
    "clubId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "assignedBy" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "ClubMemberRole_pkey" PRIMARY KEY ("id")
);

-- Create indexes for better performance
SELECT log_migration_event('CREATE INDEX', 'Creating indexes for new tables');

CREATE INDEX IF NOT EXISTS "GroupRole_groupId_idx" ON "GroupRole"("groupId");
CREATE INDEX IF NOT EXISTS "GroupMemberRole_groupId_userId_idx" ON "GroupMemberRole"("groupId", "userId");
CREATE INDEX IF NOT EXISTS "GroupMemberRole_roleId_idx" ON "GroupMemberRole"("roleId");

CREATE INDEX IF NOT EXISTS "Club_name_idx" ON "Club"("name");
CREATE INDEX IF NOT EXISTS "ClubLocation_clubId_idx" ON "ClubLocation"("clubId");
CREATE INDEX IF NOT EXISTS "ClubLocation_locationId_idx" ON "ClubLocation"("locationId");

CREATE INDEX IF NOT EXISTS "ClubSport_clubId_idx" ON "ClubSport"("clubId");
CREATE UNIQUE INDEX IF NOT EXISTS "ClubSport_clubId_name_key" ON "ClubSport"("clubId", "name");

CREATE INDEX IF NOT EXISTS "ClubGroup_clubId_idx" ON "ClubGroup"("clubId");
CREATE INDEX IF NOT EXISTS "ClubGroup_sportId_idx" ON "ClubGroup"("sportId");
CREATE INDEX IF NOT EXISTS "ClubGroup_groupId_idx" ON "ClubGroup"("groupId");

CREATE INDEX IF NOT EXISTS "ClubRole_clubId_idx" ON "ClubRole"("clubId");
CREATE INDEX IF NOT EXISTS "ClubMemberRole_clubId_userId_idx" ON "ClubMemberRole"("clubId", "userId");
CREATE INDEX IF NOT EXISTS "ClubMemberRole_roleId_idx" ON "ClubMemberRole"("roleId");

-- Add foreign key constraints
SELECT log_migration_event('ADD CONSTRAINT', 'Adding foreign key constraints');

-- GroupRole foreign keys
ALTER TABLE "GroupRole" ADD CONSTRAINT "GroupRole_groupId_fkey"
  FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- GroupMemberRole foreign keys
ALTER TABLE "GroupMemberRole" ADD CONSTRAINT "GroupMemberRole_groupId_fkey"
  FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  
ALTER TABLE "GroupMemberRole" ADD CONSTRAINT "GroupMemberRole_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  
ALTER TABLE "GroupMemberRole" ADD CONSTRAINT "GroupMemberRole_roleId_fkey"
  FOREIGN KEY ("roleId") REFERENCES "GroupRole"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  
ALTER TABLE "GroupMemberRole" ADD CONSTRAINT "GroupMemberRole_assignedBy_fkey"
  FOREIGN KEY ("assignedBy") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ClubLocation foreign keys
ALTER TABLE "ClubLocation" ADD CONSTRAINT "ClubLocation_clubId_fkey"
  FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  
ALTER TABLE "ClubLocation" ADD CONSTRAINT "ClubLocation_locationId_fkey"
  FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ClubSport foreign keys
ALTER TABLE "ClubSport" ADD CONSTRAINT "ClubSport_clubId_fkey"
  FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ClubGroup foreign keys
ALTER TABLE "ClubGroup" ADD CONSTRAINT "ClubGroup_clubId_fkey"
  FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  
ALTER TABLE "ClubGroup" ADD CONSTRAINT "ClubGroup_sportId_fkey"
  FOREIGN KEY ("sportId") REFERENCES "ClubSport"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  
ALTER TABLE "ClubGroup" ADD CONSTRAINT "ClubGroup_groupId_fkey"
  FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ClubRole foreign keys
ALTER TABLE "ClubRole" ADD CONSTRAINT "ClubRole_clubId_fkey"
  FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ClubMemberRole foreign keys
ALTER TABLE "ClubMemberRole" ADD CONSTRAINT "ClubMemberRole_clubId_fkey"
  FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  
ALTER TABLE "ClubMemberRole" ADD CONSTRAINT "ClubMemberRole_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  
ALTER TABLE "ClubMemberRole" ADD CONSTRAINT "ClubMemberRole_roleId_fkey"
  FOREIGN KEY ("roleId") REFERENCES "ClubRole"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  
ALTER TABLE "ClubMemberRole" ADD CONSTRAINT "ClubMemberRole_assignedBy_fkey"
  FOREIGN KEY ("assignedBy") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Create unique constraints
SELECT log_migration_event('ADD CONSTRAINT', 'Adding unique constraints');

-- User can have a specific role in a group only once
ALTER TABLE "GroupMemberRole" ADD CONSTRAINT "GroupMemberRole_groupId_userId_roleId_key"
  UNIQUE ("groupId", "userId", "roleId");

-- User can have a specific role in a club only once
ALTER TABLE "ClubMemberRole" ADD CONSTRAINT "ClubMemberRole_clubId_userId_roleId_key"
  UNIQUE ("clubId", "userId", "roleId");

-- A club can have a primary location only once
ALTER TABLE "ClubLocation" ADD CONSTRAINT "ClubLocation_clubId_isPrimary_check"
  CHECK (NOT ("isPrimary" = true AND EXISTS (
    SELECT 1 FROM "ClubLocation" c2 
    WHERE c2."clubId" = "clubId" AND c2."isPrimary" = true AND c2."id" != "id"
  )));

-- Create triggers for updatedAt fields
SELECT log_migration_event('CREATE TRIGGER', 'Creating updatedAt triggers');

-- Function for updating timestamp
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for GroupRole
CREATE TRIGGER update_group_role_modtime
    BEFORE UPDATE ON "GroupRole"
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

-- Trigger for Club
CREATE TRIGGER update_club_modtime
    BEFORE UPDATE ON "Club"
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

-- Trigger for ClubSport
CREATE TRIGGER update_club_sport_modtime
    BEFORE UPDATE ON "ClubSport"
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

-- Trigger for ClubGroup
CREATE TRIGGER update_club_group_modtime
    BEFORE UPDATE ON "ClubGroup"
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

-- Trigger for ClubRole
CREATE TRIGGER update_club_role_modtime
    BEFORE UPDATE ON "ClubRole"
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

-- Populate default roles
SELECT log_migration_event('INSERT DATA', 'Creating default roles for clubs and groups');

-- Default club roles
INSERT INTO "ClubRole" ("id", "clubId", "name", "description", "permissions", "inheritToGroups", "createdAt", "updatedAt")
SELECT 
    gen_random_uuid(), 
    c.id, 
    'Admin', 
    'Full administrative access to the club', 
    ARRAY['manage_club', 'manage_members', 'manage_roles', 'manage_groups', 'manage_sports', 'manage_locations', 'manage_events', 'manage_content', 'view_analytics'],
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "Club" c
ON CONFLICT DO NOTHING;

INSERT INTO "ClubRole" ("id", "clubId", "name", "description", "permissions", "inheritToGroups", "createdAt", "updatedAt")
SELECT 
    gen_random_uuid(), 
    c.id, 
    'Coach', 
    'Can manage groups and events', 
    ARRAY['manage_groups', 'manage_events', 'view_members', 'view_analytics'],
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "Club" c
ON CONFLICT DO NOTHING;

INSERT INTO "ClubRole" ("id", "clubId", "name", "description", "permissions", "inheritToGroups", "createdAt", "updatedAt")
SELECT 
    gen_random_uuid(), 
    c.id, 
    'Member', 
    'Regular club member', 
    ARRAY['view_groups', 'join_events'],
    false,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "Club" c
ON CONFLICT DO NOTHING;

-- Default group roles
INSERT INTO "GroupRole" ("id", "groupId", "name", "description", "permissions", "createdAt", "updatedAt")
SELECT 
    gen_random_uuid(), 
    g.id, 
    'Admin', 
    'Full administrative access to the group', 
    ARRAY['manage_group', 'manage_members', 'manage_roles', 'manage_events', 'manage_content', 'view_analytics'],
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "Group" g
ON CONFLICT DO NOTHING;

INSERT INTO "GroupRole" ("id", "groupId", "name", "description", "permissions", "createdAt", "updatedAt")
SELECT 
    gen_random_uuid(), 
    g.id, 
    'Moderator', 
    'Can manage content and events', 
    ARRAY['manage_events', 'manage_content', 'view_members'],
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "Group" g
ON CONFLICT DO NOTHING;

INSERT INTO "GroupRole" ("id", "groupId", "name", "description", "permissions", "createdAt", "updatedAt")
SELECT 
    gen_random_uuid(), 
    g.id, 
    'Member', 
    'Regular group member', 
    ARRAY['view_events', 'join_events', 'create_posts'],
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "Group" g
ON CONFLICT DO NOTHING;

-- Add constraint to Event table to check place type for group events
SELECT log_migration_event('MODIFY TABLE', 'Adding constraints for group events and place types');

-- Add type check for group events
ALTER TABLE "Event"
ADD CONSTRAINT check_group_event_place_type
CHECK (
  ("groupId" IS NULL) OR 
  ("groupId" IS NOT NULL AND "locationId" IS NULL) OR
  ("groupId" IS NOT NULL AND EXISTS (
    SELECT 1 FROM "Location" l WHERE l.id = "locationId" AND (l.type = 'trail' OR l.type = 'spot')
  ))
);

-- Log migration completion
SELECT log_migration_event('COMPLETE', 'Migration for Group and Club Enhancements completed successfully');

-- Commit the transaction
COMMIT; 