-- CreateEnum
CREATE TYPE "PayoutFrequency" AS ENUM ('daily', 'weekly', 'monthly', 'manual');

-- CreateEnum
CREATE TYPE "PayoutScheduleStatus" AS ENUM ('active', 'paused');

-- CreateEnum
CREATE TYPE "PayoutStatus" AS ENUM ('pending', 'in_transit', 'paid', 'failed', 'canceled');

-- CreateTable
CREATE TABLE "GroupPayoutSchedule" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "frequency" "PayoutFrequency" NOT NULL DEFAULT 'weekly',
    "status" "PayoutScheduleStatus" NOT NULL DEFAULT 'active',
    "destinationAccount" TEXT,
    "manualHold" BOOLEAN NOT NULL DEFAULT false,
    "lastPayoutAt" TIMESTAMP(3),
    "nextPayoutScheduledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GroupPayoutSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GroupPayout" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "scheduleId" TEXT,
    "amountCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "status" "PayoutStatus" NOT NULL DEFAULT 'pending',
    "initiatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "failureReason" TEXT,
    "stripePayoutId" TEXT,
    "stripeTransferId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GroupPayout_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GroupPayoutSchedule_groupId_key" ON "GroupPayoutSchedule"("groupId");

-- CreateIndex
CREATE INDEX "GroupPayoutSchedule_status_idx" ON "GroupPayoutSchedule"("status");

-- CreateIndex
CREATE INDEX "GroupPayoutSchedule_nextPayoutScheduledAt_idx" ON "GroupPayoutSchedule"("nextPayoutScheduledAt");

-- CreateIndex
CREATE INDEX "GroupPayout_groupId_idx" ON "GroupPayout"("groupId");

-- CreateIndex
CREATE INDEX "GroupPayout_status_idx" ON "GroupPayout"("status");

-- CreateIndex
CREATE INDEX "GroupPayout_initiatedAt_idx" ON "GroupPayout"("initiatedAt");

-- CreateIndex
CREATE INDEX "GroupPayout_scheduleId_idx" ON "GroupPayout"("scheduleId");

-- CreateIndex
CREATE UNIQUE INDEX "GroupPayout_stripePayoutId_key" ON "GroupPayout"("stripePayoutId");

-- AddForeignKey
ALTER TABLE "GroupPayoutSchedule" ADD CONSTRAINT "GroupPayoutSchedule_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupPayout" ADD CONSTRAINT "GroupPayout_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupPayout" ADD CONSTRAINT "GroupPayout_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "GroupPayoutSchedule"("id") ON DELETE SET NULL ON UPDATE CASCADE;
