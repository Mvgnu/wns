-- CreateEnum
CREATE TYPE "PaymentDisputeActionType" AS ENUM (
    'note',
    'evidence_submitted',
    'escalated',
    'written_off'
);

-- CreateTable
CREATE TABLE "GroupPaymentDisputeAction" (
    "id" TEXT NOT NULL,
    "disputeId" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "actionType" "PaymentDisputeActionType" NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GroupPaymentDisputeAction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GroupPaymentDisputeAction_disputeId_idx" ON "GroupPaymentDisputeAction"("disputeId");

-- CreateIndex
CREATE INDEX "GroupPaymentDisputeAction_groupId_idx" ON "GroupPaymentDisputeAction"("groupId");

-- CreateIndex
CREATE INDEX "GroupPaymentDisputeAction_actorId_idx" ON "GroupPaymentDisputeAction"("actorId");

-- CreateIndex
CREATE INDEX "GroupPaymentDisputeAction_createdAt_idx" ON "GroupPaymentDisputeAction"("createdAt");

-- AddForeignKey
ALTER TABLE "GroupPaymentDisputeAction" ADD CONSTRAINT "GroupPaymentDisputeAction_disputeId_fkey" FOREIGN KEY ("disputeId") REFERENCES "GroupPaymentDispute"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupPaymentDisputeAction" ADD CONSTRAINT "GroupPaymentDisputeAction_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupPaymentDisputeAction" ADD CONSTRAINT "GroupPaymentDisputeAction_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
