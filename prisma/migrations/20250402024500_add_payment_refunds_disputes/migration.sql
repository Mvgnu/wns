-- AlterEnum
ALTER TYPE "RevenueEntryType" ADD VALUE IF NOT EXISTS 'membership_chargeback';

-- CreateEnum
CREATE TYPE "PaymentRefundStatus" AS ENUM ('pending', 'succeeded', 'failed', 'canceled');

-- CreateEnum
CREATE TYPE "PaymentDisputeStatus" AS ENUM (
    'needs_response',
    'under_review',
    'warning_needs_response',
    'warning_under_review',
    'warning_closed',
    'charge_refunded',
    'won',
    'lost'
);

-- CreateTable
CREATE TABLE "GroupPaymentRefund" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "membershipId" TEXT,
    "userId" TEXT,
    "stripeRefundId" TEXT NOT NULL,
    "stripeChargeId" TEXT NOT NULL,
    "stripePaymentIntentId" TEXT,
    "stripeEventId" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "reason" TEXT,
    "status" "PaymentRefundStatus" NOT NULL DEFAULT 'pending',
    "failureReason" TEXT,
    "refundedAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GroupPaymentRefund_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GroupPaymentDispute" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "membershipId" TEXT,
    "userId" TEXT,
    "stripeDisputeId" TEXT NOT NULL,
    "stripeChargeId" TEXT NOT NULL,
    "stripePaymentIntentId" TEXT,
    "stripeEventId" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "reason" TEXT,
    "status" "PaymentDisputeStatus" NOT NULL DEFAULT 'needs_response',
    "evidenceDueAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GroupPaymentDispute_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GroupPaymentRefund_stripeRefundId_key" ON "GroupPaymentRefund"("stripeRefundId");

-- CreateIndex
CREATE INDEX "GroupPaymentRefund_groupId_idx" ON "GroupPaymentRefund"("groupId");

-- CreateIndex
CREATE INDEX "GroupPaymentRefund_membershipId_idx" ON "GroupPaymentRefund"("membershipId");

-- CreateIndex
CREATE INDEX "GroupPaymentRefund_stripeChargeId_idx" ON "GroupPaymentRefund"("stripeChargeId");

-- CreateIndex
CREATE INDEX "GroupPaymentRefund_stripeEventId_idx" ON "GroupPaymentRefund"("stripeEventId");

-- CreateIndex
CREATE UNIQUE INDEX "GroupPaymentDispute_stripeDisputeId_key" ON "GroupPaymentDispute"("stripeDisputeId");

-- CreateIndex
CREATE INDEX "GroupPaymentDispute_groupId_idx" ON "GroupPaymentDispute"("groupId");

-- CreateIndex
CREATE INDEX "GroupPaymentDispute_membershipId_idx" ON "GroupPaymentDispute"("membershipId");

-- CreateIndex
CREATE INDEX "GroupPaymentDispute_stripeChargeId_idx" ON "GroupPaymentDispute"("stripeChargeId");

-- CreateIndex
CREATE INDEX "GroupPaymentDispute_status_idx" ON "GroupPaymentDispute"("status");

-- CreateIndex
CREATE INDEX "GroupPaymentDispute_stripeEventId_idx" ON "GroupPaymentDispute"("stripeEventId");

-- AddForeignKey
ALTER TABLE "GroupPaymentRefund" ADD CONSTRAINT "GroupPaymentRefund_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupPaymentRefund" ADD CONSTRAINT "GroupPaymentRefund_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "GroupMembership"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupPaymentRefund" ADD CONSTRAINT "GroupPaymentRefund_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupPaymentDispute" ADD CONSTRAINT "GroupPaymentDispute_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupPaymentDispute" ADD CONSTRAINT "GroupPaymentDispute_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "GroupMembership"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupPaymentDispute" ADD CONSTRAINT "GroupPaymentDispute_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
