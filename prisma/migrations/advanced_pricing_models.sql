-- SQL Migration for Advanced Pricing Models: Tiered Pricing and Discount Codes
-- This script creates new tables for PricingTier, DiscountCode, and EventPurchase
-- and adds necessary indexes and constraints.

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
SELECT log_migration_event('START', 'Beginning migration for Advanced Pricing Models');

-- Create PricingTier table
SELECT log_migration_event('CREATE TABLE', 'Creating PricingTier table');

CREATE TABLE IF NOT EXISTS "PricingTier" (
  "id" TEXT NOT NULL,
  "eventId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "price" INTEGER NOT NULL,
  "capacity" INTEGER,
  "startDate" TIMESTAMP(3),
  "endDate" TIMESTAMP(3),
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "PricingTier_pkey" PRIMARY KEY ("id")
);

-- Create DiscountCode table
SELECT log_migration_event('CREATE TABLE', 'Creating DiscountCode table');

CREATE TABLE IF NOT EXISTS "DiscountCode" (
  "id" TEXT NOT NULL,
  "eventId" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "discountType" TEXT NOT NULL,
  "discountValue" INTEGER NOT NULL,
  "maxUses" INTEGER,
  "currentUses" INTEGER NOT NULL DEFAULT 0,
  "startDate" TIMESTAMP(3),
  "endDate" TIMESTAMP(3),
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "DiscountCode_pkey" PRIMARY KEY ("id")
);

-- Create EventPurchase table
SELECT log_migration_event('CREATE TABLE', 'Creating EventPurchase table');

CREATE TABLE IF NOT EXISTS "EventPurchase" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "eventId" TEXT NOT NULL,
  "pricingTierId" TEXT,
  "discountCodeId" TEXT,
  "originalPrice" INTEGER NOT NULL,
  "finalPrice" INTEGER NOT NULL,
  "currency" TEXT NOT NULL,
  "purchaseDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "paymentStatus" TEXT NOT NULL,

  CONSTRAINT "EventPurchase_pkey" PRIMARY KEY ("id")
);

-- Create indexes for better performance
SELECT log_migration_event('CREATE INDEX', 'Creating indexes for new tables');

CREATE INDEX IF NOT EXISTS "PricingTier_eventId_idx" ON "PricingTier"("eventId");

CREATE UNIQUE INDEX IF NOT EXISTS "DiscountCode_eventId_code_key" ON "DiscountCode"("eventId", "code");
CREATE INDEX IF NOT EXISTS "DiscountCode_code_idx" ON "DiscountCode"("code");
CREATE INDEX IF NOT EXISTS "DiscountCode_eventId_idx" ON "DiscountCode"("eventId");

CREATE INDEX IF NOT EXISTS "EventPurchase_userId_idx" ON "EventPurchase"("userId");
CREATE INDEX IF NOT EXISTS "EventPurchase_eventId_idx" ON "EventPurchase"("eventId");

-- Add foreign key constraints
SELECT log_migration_event('ADD CONSTRAINT', 'Adding foreign key constraints');

-- PricingTier foreign keys
ALTER TABLE "PricingTier" ADD CONSTRAINT "PricingTier_eventId_fkey"
  FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- DiscountCode foreign keys
ALTER TABLE "DiscountCode" ADD CONSTRAINT "DiscountCode_eventId_fkey"
  FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- EventPurchase foreign keys
ALTER TABLE "EventPurchase" ADD CONSTRAINT "EventPurchase_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "EventPurchase" ADD CONSTRAINT "EventPurchase_pricingTierId_fkey"
  FOREIGN KEY ("pricingTierId") REFERENCES "PricingTier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "EventPurchase" ADD CONSTRAINT "EventPurchase_discountCodeId_fkey"
  FOREIGN KEY ("discountCodeId") REFERENCES "DiscountCode"("id") ON DELETE SET NULL ON UPDATE CASCADE;

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

-- Trigger for PricingTier
CREATE TRIGGER update_pricing_tier_modtime
    BEFORE UPDATE ON "PricingTier"
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

-- Trigger for DiscountCode
CREATE TRIGGER update_discount_code_modtime
    BEFORE UPDATE ON "DiscountCode"
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

-- Log migration completion
SELECT log_migration_event('COMPLETE', 'Migration for Advanced Pricing Models completed successfully');

-- Commit the transaction
COMMIT; 