-- Add Stripe reference columns to group memberships
ALTER TABLE "GroupMembership"
  ADD COLUMN "stripeCustomerId" TEXT,
  ADD COLUMN "stripeSubscriptionId" TEXT,
  ADD COLUMN "stripeCheckoutSessionId" TEXT,
  ADD COLUMN "stripePaymentIntentId" TEXT,
  ADD COLUMN "stripeLastEventId" TEXT;

CREATE INDEX "GroupMembership_stripeCustomerId_idx" ON "GroupMembership"("stripeCustomerId");
CREATE INDEX "GroupMembership_stripeSubscriptionId_idx" ON "GroupMembership"("stripeSubscriptionId");
CREATE INDEX "GroupMembership_stripeCheckoutSessionId_idx" ON "GroupMembership"("stripeCheckoutSessionId");
