-- SQL Migration for Event Pricing, Amenities, and Co-organizers
-- This script adds new fields to the Event table and creates the EventOrganizer table
-- with proper indexes and constraints.

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
SELECT log_migration_event('START', 'Beginning migration for Event enhancements');

-- Add new pricing and capacity fields to Event table
SELECT log_migration_event('ALTER TABLE', 'Adding new columns to Event table');

ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "isPaid" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "price" FLOAT;
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "priceCurrency" TEXT;
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "priceDescription" TEXT;
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "maxAttendees" INTEGER;
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "isSoldOut" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "highlightedAmenities" TEXT[] NOT NULL DEFAULT '{}';

-- Create indexes for performance
SELECT log_migration_event('CREATE INDEX', 'Creating indexes for new columns');

CREATE INDEX IF NOT EXISTS "Event_isPaid_idx" ON "Event"("isPaid");
CREATE INDEX IF NOT EXISTS "Event_isSoldOut_idx" ON "Event"("isSoldOut");

-- Ensure EventOrganizer table exists (if not already created)
SELECT log_migration_event('CREATE TABLE', 'Creating EventOrganizer table if not exists');
-- If this table already exists, the CREATE TABLE will be skipped due to IF NOT EXISTS
CREATE TABLE IF NOT EXISTS "EventOrganizer" (
  "id" TEXT NOT NULL,
  "role" TEXT NOT NULL DEFAULT 'co-organizer',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "eventId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,

  CONSTRAINT "EventOrganizer_pkey" PRIMARY KEY ("id")
);

-- Add unique constraint and indexes
SELECT log_migration_event('CREATE INDEX', 'Creating indexes for EventOrganizer table');

CREATE UNIQUE INDEX IF NOT EXISTS "EventOrganizer_eventId_userId_key" ON "EventOrganizer"("eventId", "userId");
CREATE INDEX IF NOT EXISTS "EventOrganizer_eventId_idx" ON "EventOrganizer"("eventId");
CREATE INDEX IF NOT EXISTS "EventOrganizer_userId_idx" ON "EventOrganizer"("userId");
CREATE INDEX IF NOT EXISTS "EventOrganizer_role_idx" ON "EventOrganizer"("role");

-- Add foreign key constraints if they don't exist
SELECT log_migration_event('ADD CONSTRAINT', 'Adding foreign key constraints');

-- Note: We need to check if the constraint exists before adding it
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'EventOrganizer_eventId_fkey'
  ) THEN
    ALTER TABLE "EventOrganizer" ADD CONSTRAINT "EventOrganizer_eventId_fkey" 
      FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    RAISE NOTICE 'Added constraint EventOrganizer_eventId_fkey';
  ELSE
    RAISE NOTICE 'Constraint EventOrganizer_eventId_fkey already exists';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'EventOrganizer_userId_fkey'
  ) THEN
    ALTER TABLE "EventOrganizer" ADD CONSTRAINT "EventOrganizer_userId_fkey" 
      FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    RAISE NOTICE 'Added constraint EventOrganizer_userId_fkey';
  ELSE
    RAISE NOTICE 'Constraint EventOrganizer_userId_fkey already exists';
  END IF;
END
$$;

-- Update existing events to use the new schema
SELECT log_migration_event('UPDATE DATA', 'Updating existing event records');

-- Set all existing events as free
UPDATE "Event" SET "isPaid" = false WHERE "isPaid" IS NULL;

-- Set isSoldOut based on maxAttendees and current attendee count
UPDATE "Event" e
SET "isSoldOut" = (
  SELECT COUNT(*) >= e."maxAttendees"
  FROM "_EventToUser" eu
  WHERE eu."A" = e.id
)
WHERE e."maxAttendees" IS NOT NULL;

-- Initialize empty highlightedAmenities arrays
UPDATE "Event" SET "highlightedAmenities" = '{}' WHERE "highlightedAmenities" IS NULL;

-- Log migration completion
SELECT log_migration_event('COMPLETE', 'Migration for Event enhancements completed successfully');

-- Commit the transaction
COMMIT; 