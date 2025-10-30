-- CreateEnum
CREATE TYPE "MembershipDiscountType" AS ENUM ('percentage', 'fixed_amount');

-- CreateTable
CREATE TABLE "GroupMembershipCoupon" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "discountType" "MembershipDiscountType" NOT NULL DEFAULT 'percentage',
    "percentageOff" INTEGER,
    "amountOffCents" INTEGER,
    "currency" TEXT,
    "maxRedemptions" INTEGER,
    "redemptionCount" INTEGER NOT NULL DEFAULT 0,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "stripeCouponId" TEXT,
    "stripePromotionCodeId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GroupMembershipCoupon_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "GroupRevenueEntry" ADD COLUMN     "couponId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "GroupMembershipCoupon_groupId_code_key" ON "GroupMembershipCoupon"("groupId", "code");

-- CreateIndex
CREATE INDEX "GroupMembershipCoupon_groupId_idx" ON "GroupMembershipCoupon"("groupId");

-- CreateIndex
CREATE INDEX "GroupRevenueEntry_couponId_idx" ON "GroupRevenueEntry"("couponId");

-- AddForeignKey
ALTER TABLE "GroupMembershipCoupon" ADD CONSTRAINT "GroupMembershipCoupon_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Gro
up"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupRevenueEntry" ADD CONSTRAINT "GroupRevenueEntry_couponId_fkey" FOREIGN KEY ("couponId") REFERENCES "GroupMemb
ershipCoupon"("id") ON DELETE SET NULL ON UPDATE CASCADE;
