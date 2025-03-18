-- AlterTable
ALTER TABLE "Notification" ADD COLUMN     "actorId" TEXT,
ADD COLUMN     "linkUrl" TEXT;

-- CreateIndex
CREATE INDEX "Notification_actorId_idx" ON "Notification"("actorId");
