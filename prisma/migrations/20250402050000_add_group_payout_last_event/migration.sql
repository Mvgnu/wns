-- Add stripeLastEventId column to GroupPayout for webhook idempotency tracking
ALTER TABLE "GroupPayout"
ADD COLUMN     "stripeLastEventId" TEXT;

-- Index for quick lookup by last processed Stripe event
CREATE INDEX "GroupPayout_stripeLastEventId_idx" ON "GroupPayout"("stripeLastEventId");
