/*
  Warnings:

  - Changed the type of `type` on the `PlaceAmenity` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `updatedAt` to the `PlaceStaff` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "AmenityType" AS ENUM ('shower', 'food', 'shop', 'wellness', 'locker_room', 'parking', 'card_payment', 'wifi', 'restroom', 'water_fountain', 'equipment_rental', 'first_aid', 'childcare', 'disabled_access', 'bike_storage', 'training_area');

-- First clear out the existing PlaceAmenity data
DELETE FROM "PlaceAmenity";

-- AlterTable
ALTER TABLE "PlaceAmenity" ADD COLUMN     "isAvailable" BOOLEAN NOT NULL DEFAULT true,
DROP COLUMN "type",
ADD COLUMN     "type" "AmenityType" NOT NULL;

-- AlterTable - Add default value for updatedAt
ALTER TABLE "PlaceStaff" ADD COLUMN     "bio" TEXT,
ADD COLUMN     "certifications" TEXT[],
ADD COLUMN     "schedule" JSONB,
ADD COLUMN     "socialLinks" JSONB,
ADD COLUMN     "specialties" TEXT[],
ADD COLUMN     "title" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "yearsExperience" INTEGER;

-- After migration, remove the default constraint
ALTER TABLE "PlaceStaff" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- CreateTable
CREATE TABLE "LocationVideo" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "url" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "duration" INTEGER,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "locationId" TEXT NOT NULL,
    "uploadedById" TEXT NOT NULL,

    CONSTRAINT "LocationVideo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LocationPrice" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "period" TEXT,
    "isRecurring" BOOLEAN NOT NULL DEFAULT false,
    "courseId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "locationId" TEXT NOT NULL,

    CONSTRAINT "LocationPrice_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LocationVideo_locationId_idx" ON "LocationVideo"("locationId");

-- CreateIndex
CREATE INDEX "LocationVideo_uploadedById_idx" ON "LocationVideo"("uploadedById");

-- CreateIndex
CREATE INDEX "LocationPrice_locationId_idx" ON "LocationPrice"("locationId");

-- CreateIndex
CREATE INDEX "LocationPrice_courseId_idx" ON "LocationPrice"("courseId");

-- CreateIndex
CREATE INDEX "PlaceAmenity_type_idx" ON "PlaceAmenity"("type");

-- CreateIndex
CREATE UNIQUE INDEX "PlaceAmenity_locationId_type_key" ON "PlaceAmenity"("locationId", "type");

-- AddForeignKey
ALTER TABLE "LocationVideo" ADD CONSTRAINT "LocationVideo_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LocationVideo" ADD CONSTRAINT "LocationVideo_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LocationPrice" ADD CONSTRAINT "LocationPrice_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE CASCADE ON UPDATE CASCADE;
