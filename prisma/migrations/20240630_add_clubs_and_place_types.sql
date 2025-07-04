-- Create Place Type enum if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'place_type') THEN
    CREATE TYPE "place_type" AS ENUM ('building', 'trail', 'spot');
  END IF;
END $$;

-- Add place_type to Location table if it doesn't exist
ALTER TABLE "Location" 
ADD COLUMN IF NOT EXISTS "type" "place_type" NOT NULL DEFAULT 'building';

-- Create GroupRole table
CREATE TABLE IF NOT EXISTS "GroupRole" (
  "id" TEXT NOT NULL,
  "groupId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "permissions" JSONB NOT NULL,
  "isDefault" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "GroupRole_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "GroupRole_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create index on GroupRole for faster lookups
CREATE INDEX IF NOT EXISTS "GroupRole_groupId_idx" ON "GroupRole"("groupId");

-- Create GroupMemberRole table to link members to roles
CREATE TABLE IF NOT EXISTS "GroupMemberRole" (
  "id" TEXT NOT NULL,
  "memberId" TEXT NOT NULL,
  "roleId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "GroupMemberRole_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "GroupMemberRole_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "GroupMember"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "GroupMemberRole_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "GroupRole"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create unique index to ensure one role per member
CREATE UNIQUE INDEX IF NOT EXISTS "GroupMemberRole_memberId_roleId_key" ON "GroupMemberRole"("memberId", "roleId");
CREATE INDEX IF NOT EXISTS "GroupMemberRole_roleId_idx" ON "GroupMemberRole"("roleId");

-- Add columns to Group table for enhanced functionality
ALTER TABLE "Group"
ADD COLUMN IF NOT EXISTS "entryRules" JSONB DEFAULT '{"joinPolicy": "request", "approvalRequired": true, "requiresProfile": false}',
ADD COLUMN IF NOT EXISTS "settings" JSONB DEFAULT '{"visibility": "public", "contentPolicy": "anyone", "eventsPolicy": "approved", "joinPolicy": "request", "allowMembersToInvite": true, "showMemberList": true, "defaultMemberRole": "member", "notifications": {"newMembers": true, "newPosts": true, "newEvents": true, "eventReminders": true}}';

-- Create Club table
CREATE TABLE IF NOT EXISTS "Club" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "slug" TEXT NOT NULL,
  "imageUrl" TEXT,
  "websiteUrl" TEXT,
  "email" TEXT,
  "phone" TEXT,
  "address" TEXT,
  "city" TEXT,
  "state" TEXT,
  "postalCode" TEXT,
  "country" TEXT,
  "foundedYear" INTEGER,
  "settings" JSONB DEFAULT '{"allowPublicGroups": true, "allowMembersToCreateGroups": false, "requireApprovalForEvents": true, "allowMembersToInvite": true, "showMemberList": true, "defaultMemberRole": "member"}',
  "verifiedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "ownerId" TEXT,

  CONSTRAINT "Club_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Club_slug_key" UNIQUE ("slug"),
  CONSTRAINT "Club_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- Create index for Club slugs for faster lookups
CREATE INDEX IF NOT EXISTS "Club_slug_idx" ON "Club"("slug");
CREATE INDEX IF NOT EXISTS "Club_ownerId_idx" ON "Club"("ownerId");

-- Create ClubLocation junction table
CREATE TABLE IF NOT EXISTS "ClubLocation" (
  "id" TEXT NOT NULL,
  "clubId" TEXT NOT NULL,
  "locationId" TEXT NOT NULL,
  "isPrimary" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ClubLocation_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ClubLocation_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "ClubLocation_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create unique index for ClubLocation to ensure unique club-location pairs
CREATE UNIQUE INDEX IF NOT EXISTS "ClubLocation_clubId_locationId_key" ON "ClubLocation"("clubId", "locationId");
CREATE INDEX IF NOT EXISTS "ClubLocation_locationId_idx" ON "ClubLocation"("locationId");

-- Create ClubSport table
CREATE TABLE IF NOT EXISTS "ClubSport" (
  "id" TEXT NOT NULL,
  "clubId" TEXT NOT NULL,
  "sportType" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "imageUrl" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ClubSport_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ClubSport_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create index for ClubSport for faster lookups
CREATE INDEX IF NOT EXISTS "ClubSport_clubId_idx" ON "ClubSport"("clubId");
CREATE INDEX IF NOT EXISTS "ClubSport_sportType_idx" ON "ClubSport"("sportType");

-- Create ClubGroup junction table to link clubs and groups
CREATE TABLE IF NOT EXISTS "ClubGroup" (
  "id" TEXT NOT NULL,
  "clubId" TEXT NOT NULL,
  "groupId" TEXT NOT NULL,
  "sportId" TEXT NOT NULL,
  "ageGroup" TEXT,
  "gender" TEXT,
  "level" TEXT,
  "isDefault" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ClubGroup_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ClubGroup_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "ClubGroup_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "ClubGroup_sportId_fkey" FOREIGN KEY ("sportId") REFERENCES "ClubSport"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create unique index for ClubGroup to ensure unique club-group pairs
CREATE UNIQUE INDEX IF NOT EXISTS "ClubGroup_clubId_groupId_key" ON "ClubGroup"("clubId", "groupId");
CREATE INDEX IF NOT EXISTS "ClubGroup_groupId_idx" ON "ClubGroup"("groupId");
CREATE INDEX IF NOT EXISTS "ClubGroup_sportId_idx" ON "ClubGroup"("sportId");

-- Create ClubRole table
CREATE TABLE IF NOT EXISTS "ClubRole" (
  "id" TEXT NOT NULL,
  "clubId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "permissions" JSONB NOT NULL,
  "isDefault" BOOLEAN NOT NULL DEFAULT false,
  "inheritToGroups" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ClubRole_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ClubRole_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create index on ClubRole for faster lookups
CREATE INDEX IF NOT EXISTS "ClubRole_clubId_idx" ON "ClubRole"("clubId");

-- Create ClubMember table
CREATE TABLE IF NOT EXISTS "ClubMember" (
  "id" TEXT NOT NULL,
  "clubId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'active',
  "joinedAt" TIMESTAMP(3),
  "invitedBy" TEXT,
  "invitedAt" TIMESTAMP(3),
  "lastActive" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ClubMember_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ClubMember_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "ClubMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create unique index to ensure each user is only a member once
CREATE UNIQUE INDEX IF NOT EXISTS "ClubMember_clubId_userId_key" ON "ClubMember"("clubId", "userId");
CREATE INDEX IF NOT EXISTS "ClubMember_userId_idx" ON "ClubMember"("userId");

-- Create ClubMemberRole junction table
CREATE TABLE IF NOT EXISTS "ClubMemberRole" (
  "id" TEXT NOT NULL,
  "memberId" TEXT NOT NULL,
  "roleId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ClubMemberRole_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ClubMemberRole_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "ClubMember"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "ClubMemberRole_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "ClubRole"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create unique index to ensure one role per member
CREATE UNIQUE INDEX IF NOT EXISTS "ClubMemberRole_memberId_roleId_key" ON "ClubMemberRole"("memberId", "roleId");
CREATE INDEX IF NOT EXISTS "ClubMemberRole_roleId_idx" ON "ClubMemberRole"("roleId");

-- Update or create status column on GroupMember if it doesn't exist
ALTER TABLE "GroupMember"
ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'active',
ADD COLUMN IF NOT EXISTS "invitedBy" TEXT,
ADD COLUMN IF NOT EXISTS "invitedAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "lastActive" TIMESTAMP(3);

-- Create an index for the status column
CREATE INDEX IF NOT EXISTS "GroupMember_status_idx" ON "GroupMember"("status");

-- Create triggers to auto-update timestamp columns
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply the trigger to all tables with updatedAt
DO $$
DECLARE
  t text;
BEGIN
  FOR t IN
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name IN (
      'GroupRole', 'GroupMemberRole', 'ClubRole', 'ClubMemberRole',
      'Club', 'ClubLocation', 'ClubSport', 'ClubGroup', 'ClubMember'
    )
  LOOP
    EXECUTE format('
      DROP TRIGGER IF EXISTS set_%I_updated_at ON "%I";
      CREATE TRIGGER set_%I_updated_at
      BEFORE UPDATE ON "%I"
      FOR EACH ROW
      EXECUTE FUNCTION update_timestamp();
    ', t, t, t, t);
  END LOOP;
END;
$$; 