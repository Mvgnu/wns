/*
  Warnings:

  - A unique constraint covering the columns `[slug]` on the table `Event` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[slug]` on the table `Location` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "public"."Event" ADD COLUMN     "slug" TEXT;

-- AlterTable
ALTER TABLE "public"."Location" ADD COLUMN     "slug" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Event_slug_key" ON "public"."Event"("slug");

-- CreateIndex
CREATE INDEX "Event_slug_idx" ON "public"."Event"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Location_slug_key" ON "public"."Location"("slug");

-- CreateIndex
CREATE INDEX "Location_slug_idx" ON "public"."Location"("slug");
