/*
  Warnings:

  - You are about to drop the column `rating` on the `Location` table. All the data in the column will be lost.
  - The `type` column on the `Location` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[slug]` on the table `Group` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `detailType` to the `Location` table without a default value. This is not possible if the table is not empty.
  - Added the required column `placeType` to the `Location` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `LocationReview` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "PlaceType" AS ENUM ('building', 'trail', 'spot');

-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "highlightedAmenities" TEXT[],
ADD COLUMN     "isPaid" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isSoldOut" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "maxAttendees" INTEGER,
ADD COLUMN     "price" DOUBLE PRECISION,
ADD COLUMN     "priceCurrency" TEXT,
ADD COLUMN     "priceDescription" TEXT;

-- AlterTable
ALTER TABLE "Group" ADD COLUMN     "entryRules" JSONB NOT NULL DEFAULT '{"requireApproval": false, "allowPublicJoin": true, "inviteOnly": false, "joinCode": null}',
ADD COLUMN     "memberCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "settings" JSONB NOT NULL DEFAULT '{"allowMemberPosts": true, "allowMemberEvents": false, "visibility": "public", "contentModeration": "low"}',
ADD COLUMN     "slug" TEXT,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'active';

-- AlterTable
ALTER TABLE "Location" DROP COLUMN "rating",
ADD COLUMN     "capacity" INTEGER,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "country" TEXT,
ADD COLUMN     "detailType" TEXT NOT NULL,
ADD COLUMN     "difficulty" TEXT,
ADD COLUMN     "distance" DOUBLE PRECISION,
ADD COLUMN     "elevation" DOUBLE PRECISION,
ADD COLUMN     "email" TEXT,
ADD COLUMN     "featured" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "hasParking" BOOLEAN,
ADD COLUMN     "image" TEXT,
ADD COLUMN     "isAccessible" BOOLEAN,
ADD COLUMN     "isPublic" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "openingHours" JSONB,
ADD COLUMN     "ownershipType" TEXT,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "placeType" TEXT NOT NULL,
ADD COLUMN     "priceRange" TEXT,
ADD COLUMN     "routeType" TEXT,
ADD COLUMN     "spotFeatures" TEXT[],
ADD COLUMN     "state" TEXT,
ADD COLUMN     "surfaceType" TEXT,
ADD COLUMN     "typeMetadata" JSONB,
ADD COLUMN     "verified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "website" TEXT,
ADD COLUMN     "zipCode" TEXT,
DROP COLUMN "type",
ADD COLUMN     "type" "PlaceType" NOT NULL DEFAULT 'building';

-- AlterTable
ALTER TABLE "LocationReview" ADD COLUMN     "atmosphere" DOUBLE PRECISION,
ADD COLUMN     "cleanliness" DOUBLE PRECISION,
ADD COLUMN     "helpfulCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "reviewImages" TEXT[],
ADD COLUMN     "reviewTitle" TEXT,
ADD COLUMN     "service" DOUBLE PRECISION,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "value" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "isAdmin" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "PlaceAmenity" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "details" JSONB,
    "locationId" TEXT NOT NULL,

    CONSTRAINT "PlaceAmenity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlaceStaff" (
    "id" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "canEditPlace" BOOLEAN NOT NULL DEFAULT false,
    "canManageEvents" BOOLEAN NOT NULL DEFAULT false,
    "canManageStaff" BOOLEAN NOT NULL DEFAULT false,
    "locationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "PlaceStaff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventOrganizer" (
    "id" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'co-organizer',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "eventId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "EventOrganizer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlaceClaim" (
    "id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "claimReason" TEXT NOT NULL,
    "proofDetails" TEXT,
    "contactPhone" TEXT,
    "contactEmail" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "locationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "reviewedById" TEXT,
    "reviewNotes" TEXT,

    CONSTRAINT "PlaceClaim_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PricingTier" (
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

-- CreateTable
CREATE TABLE "DiscountCode" (
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

-- CreateTable
CREATE TABLE "EventPurchase" (
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

-- CreateTable
CREATE TABLE "GroupRole" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT,
    "permissions" TEXT[],
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GroupRole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GroupMemberRole" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "assignedBy" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GroupMemberRole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Club" (
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

-- CreateTable
CREATE TABLE "ClubLocation" (
    "id" TEXT NOT NULL,
    "clubId" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClubLocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClubSport" (
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

-- CreateTable
CREATE TABLE "ClubGroup" (
    "id" TEXT NOT NULL,
    "clubId" TEXT NOT NULL,
    "sportId" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "level" TEXT,
    "ageGroup" TEXT,
    "gender" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClubGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClubRole" (
    "id" TEXT NOT NULL,
    "clubId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT,
    "permissions" TEXT[],
    "inheritToGroups" BOOLEAN NOT NULL DEFAULT false,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClubRole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClubMemberRole" (
    "id" TEXT NOT NULL,
    "clubId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "assignedBy" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClubMemberRole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GroupMemberStatus" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "joinedAt" TIMESTAMP(3),
    "invitedBy" TEXT,
    "invitedAt" TIMESTAMP(3),
    "lastActive" TIMESTAMP(3),

    CONSTRAINT "GroupMemberStatus_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PlaceAmenity_locationId_idx" ON "PlaceAmenity"("locationId");

-- CreateIndex
CREATE INDEX "PlaceAmenity_type_idx" ON "PlaceAmenity"("type");

-- CreateIndex
CREATE UNIQUE INDEX "PlaceAmenity_locationId_type_key" ON "PlaceAmenity"("locationId", "type");

-- CreateIndex
CREATE INDEX "PlaceStaff_locationId_idx" ON "PlaceStaff"("locationId");

-- CreateIndex
CREATE INDEX "PlaceStaff_userId_idx" ON "PlaceStaff"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "PlaceStaff_locationId_userId_key" ON "PlaceStaff"("locationId", "userId");

-- CreateIndex
CREATE INDEX "EventOrganizer_eventId_idx" ON "EventOrganizer"("eventId");

-- CreateIndex
CREATE INDEX "EventOrganizer_userId_idx" ON "EventOrganizer"("userId");

-- CreateIndex
CREATE INDEX "EventOrganizer_role_idx" ON "EventOrganizer"("role");

-- CreateIndex
CREATE UNIQUE INDEX "EventOrganizer_eventId_userId_key" ON "EventOrganizer"("eventId", "userId");

-- CreateIndex
CREATE INDEX "PlaceClaim_locationId_idx" ON "PlaceClaim"("locationId");

-- CreateIndex
CREATE INDEX "PlaceClaim_userId_idx" ON "PlaceClaim"("userId");

-- CreateIndex
CREATE INDEX "PlaceClaim_status_idx" ON "PlaceClaim"("status");

-- CreateIndex
CREATE INDEX "PlaceClaim_createdAt_idx" ON "PlaceClaim"("createdAt");

-- CreateIndex
CREATE INDEX "PricingTier_eventId_idx" ON "PricingTier"("eventId");

-- CreateIndex
CREATE INDEX "DiscountCode_code_idx" ON "DiscountCode"("code");

-- CreateIndex
CREATE INDEX "DiscountCode_eventId_idx" ON "DiscountCode"("eventId");

-- CreateIndex
CREATE UNIQUE INDEX "DiscountCode_eventId_code_key" ON "DiscountCode"("eventId", "code");

-- CreateIndex
CREATE INDEX "EventPurchase_userId_idx" ON "EventPurchase"("userId");

-- CreateIndex
CREATE INDEX "EventPurchase_eventId_idx" ON "EventPurchase"("eventId");

-- CreateIndex
CREATE UNIQUE INDEX "GroupRole_groupId_name_key" ON "GroupRole"("groupId", "name");

-- CreateIndex
CREATE INDEX "GroupMemberRole_groupId_userId_idx" ON "GroupMemberRole"("groupId", "userId");

-- CreateIndex
CREATE INDEX "GroupMemberRole_roleId_idx" ON "GroupMemberRole"("roleId");

-- CreateIndex
CREATE UNIQUE INDEX "GroupMemberRole_groupId_userId_roleId_key" ON "GroupMemberRole"("groupId", "userId", "roleId");

-- CreateIndex
CREATE INDEX "Club_name_idx" ON "Club"("name");

-- CreateIndex
CREATE INDEX "ClubLocation_clubId_idx" ON "ClubLocation"("clubId");

-- CreateIndex
CREATE INDEX "ClubLocation_locationId_idx" ON "ClubLocation"("locationId");

-- CreateIndex
CREATE INDEX "ClubSport_clubId_idx" ON "ClubSport"("clubId");

-- CreateIndex
CREATE UNIQUE INDEX "ClubSport_clubId_name_key" ON "ClubSport"("clubId", "name");

-- CreateIndex
CREATE INDEX "ClubGroup_clubId_idx" ON "ClubGroup"("clubId");

-- CreateIndex
CREATE INDEX "ClubGroup_sportId_idx" ON "ClubGroup"("sportId");

-- CreateIndex
CREATE INDEX "ClubGroup_groupId_idx" ON "ClubGroup"("groupId");

-- CreateIndex
CREATE INDEX "ClubGroup_level_gender_ageGroup_idx" ON "ClubGroup"("level", "gender", "ageGroup");

-- CreateIndex
CREATE INDEX "ClubRole_clubId_idx" ON "ClubRole"("clubId");

-- CreateIndex
CREATE UNIQUE INDEX "ClubRole_clubId_name_key" ON "ClubRole"("clubId", "name");

-- CreateIndex
CREATE INDEX "ClubMemberRole_clubId_userId_idx" ON "ClubMemberRole"("clubId", "userId");

-- CreateIndex
CREATE INDEX "ClubMemberRole_roleId_idx" ON "ClubMemberRole"("roleId");

-- CreateIndex
CREATE UNIQUE INDEX "ClubMemberRole_clubId_userId_roleId_key" ON "ClubMemberRole"("clubId", "userId", "roleId");

-- CreateIndex
CREATE INDEX "GroupMemberStatus_groupId_status_idx" ON "GroupMemberStatus"("groupId", "status");

-- CreateIndex
CREATE INDEX "GroupMemberStatus_userId_idx" ON "GroupMemberStatus"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "GroupMemberStatus_groupId_userId_key" ON "GroupMemberStatus"("groupId", "userId");

-- CreateIndex
CREATE INDEX "Event_isPaid_idx" ON "Event"("isPaid");

-- CreateIndex
CREATE UNIQUE INDEX "Group_slug_key" ON "Group"("slug");

-- CreateIndex
CREATE INDEX "Group_status_idx" ON "Group"("status");

-- CreateIndex
CREATE INDEX "Group_slug_idx" ON "Group"("slug");

-- CreateIndex
CREATE INDEX "Location_placeType_detailType_idx" ON "Location"("placeType", "detailType");

-- CreateIndex
CREATE INDEX "Location_sports_idx" ON "Location"("sports");

-- CreateIndex
CREATE INDEX "Location_verified_featured_idx" ON "Location"("verified", "featured");

-- CreateIndex
CREATE INDEX "Location_priceRange_idx" ON "Location"("priceRange");

-- CreateIndex
CREATE INDEX "Location_difficulty_idx" ON "Location"("difficulty");

-- CreateIndex
CREATE INDEX "Location_type_idx" ON "Location"("type");

-- CreateIndex
CREATE INDEX "Location_city_state_country_idx" ON "Location"("city", "state", "country");

-- CreateIndex
CREATE INDEX "LocationReview_helpfulCount_idx" ON "LocationReview"("helpfulCount");

-- AddForeignKey
ALTER TABLE "PlaceAmenity" ADD CONSTRAINT "PlaceAmenity_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlaceStaff" ADD CONSTRAINT "PlaceStaff_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlaceStaff" ADD CONSTRAINT "PlaceStaff_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventOrganizer" ADD CONSTRAINT "EventOrganizer_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventOrganizer" ADD CONSTRAINT "EventOrganizer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlaceClaim" ADD CONSTRAINT "PlaceClaim_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlaceClaim" ADD CONSTRAINT "PlaceClaim_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlaceClaim" ADD CONSTRAINT "PlaceClaim_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PricingTier" ADD CONSTRAINT "PricingTier_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscountCode" ADD CONSTRAINT "DiscountCode_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventPurchase" ADD CONSTRAINT "EventPurchase_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventPurchase" ADD CONSTRAINT "EventPurchase_pricingTierId_fkey" FOREIGN KEY ("pricingTierId") REFERENCES "PricingTier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventPurchase" ADD CONSTRAINT "EventPurchase_discountCodeId_fkey" FOREIGN KEY ("discountCodeId") REFERENCES "DiscountCode"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupRole" ADD CONSTRAINT "GroupRole_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupMemberRole" ADD CONSTRAINT "GroupMemberRole_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupMemberRole" ADD CONSTRAINT "GroupMemberRole_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupMemberRole" ADD CONSTRAINT "GroupMemberRole_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "GroupRole"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupMemberRole" ADD CONSTRAINT "GroupMemberRole_assignedBy_fkey" FOREIGN KEY ("assignedBy") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClubLocation" ADD CONSTRAINT "ClubLocation_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClubLocation" ADD CONSTRAINT "ClubLocation_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClubSport" ADD CONSTRAINT "ClubSport_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClubGroup" ADD CONSTRAINT "ClubGroup_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClubGroup" ADD CONSTRAINT "ClubGroup_sportId_fkey" FOREIGN KEY ("sportId") REFERENCES "ClubSport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClubGroup" ADD CONSTRAINT "ClubGroup_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClubRole" ADD CONSTRAINT "ClubRole_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClubMemberRole" ADD CONSTRAINT "ClubMemberRole_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClubMemberRole" ADD CONSTRAINT "ClubMemberRole_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClubMemberRole" ADD CONSTRAINT "ClubMemberRole_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "ClubRole"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClubMemberRole" ADD CONSTRAINT "ClubMemberRole_assignedBy_fkey" FOREIGN KEY ("assignedBy") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupMemberStatus" ADD CONSTRAINT "GroupMemberStatus_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupMemberStatus" ADD CONSTRAINT "GroupMemberStatus_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
