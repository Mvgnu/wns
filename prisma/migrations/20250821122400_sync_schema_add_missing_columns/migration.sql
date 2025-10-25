/*
  Warnings:

  - A unique constraint covering the columns `[slug]` on the table `Club` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `name` to the `PlaceAmenity` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."Club" ADD COLUMN     "slug" TEXT;

-- AlterTable
ALTER TABLE "public"."Location" ADD COLUMN     "rating" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "public"."PlaceAmenity" ADD COLUMN     "name" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Club_slug_key" ON "public"."Club"("slug");

-- CreateIndex
CREATE INDEX "Club_slug_idx" ON "public"."Club"("slug");

-- CreateIndex
CREATE INDEX "PlaceAmenity_name_idx" ON "public"."PlaceAmenity"("name");
