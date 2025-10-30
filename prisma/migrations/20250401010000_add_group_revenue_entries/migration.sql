-- CreateEnum
CREATE TYPE "RevenueEntryType" AS ENUM ('membership_charge', 'membership_refund');

-- CreateTable
CREATE TABLE "GroupRevenueEntry" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "membershipId" TEXT,
    "userId" TEXT,
    "type" "RevenueEntryType" NOT NULL,
    "amountGrossCents" INTEGER NOT NULL,
    "amountNetCents" INTEGER NOT NULL,
    "feeCents" INTEGER NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "stripeEventId" TEXT NOT NULL,
    "stripeObjectId" TEXT,
    "stripeBalanceTransaction" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GroupRevenueEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GroupRevenueEntry_groupId_idx" ON "GroupRevenueEntry"("groupId");

-- CreateIndex
CREATE INDEX "GroupRevenueEntry_membershipId_idx" ON "GroupRevenueEntry"("membershipId");

-- CreateIndex
CREATE INDEX "GroupRevenueEntry_userId_idx" ON "GroupRevenueEntry"("userId");

-- CreateIndex
CREATE INDEX "GroupRevenueEntry_occurredAt_idx" ON "GroupRevenueEntry"("occurredAt");

-- CreateIndex
CREATE UNIQUE INDEX "GroupRevenueEntry_stripeEventId_key" ON "GroupRevenueEntry"("stripeEventId");

-- AddForeignKey
ALTER TABLE "GroupRevenueEntry" ADD CONSTRAINT "GroupRevenueEntry_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupRevenueEntry" ADD CONSTRAINT "GroupRevenueEntry_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "GroupMembership"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupRevenueEntry" ADD CONSTRAINT "GroupRevenueEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
