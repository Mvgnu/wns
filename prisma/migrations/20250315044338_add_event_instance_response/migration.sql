-- AlterTable
ALTER TABLE "Group" ADD COLUMN     "activityLevel" TEXT,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "country" TEXT,
ADD COLUMN     "groupTags" TEXT[],
ADD COLUMN     "locationName" TEXT,
ADD COLUMN     "state" TEXT,
ADD COLUMN     "zipCode" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "activityLevel" TEXT,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "country" TEXT,
ADD COLUMN     "interestTags" TEXT[],
ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "locationName" TEXT,
ADD COLUMN     "longitude" DOUBLE PRECISION,
ADD COLUMN     "preferredRadius" INTEGER,
ADD COLUMN     "state" TEXT,
ADD COLUMN     "zipCode" TEXT;

-- CreateTable
CREATE TABLE "EventReminder" (
    "id" TEXT NOT NULL,
    "reminderType" TEXT NOT NULL,
    "hoursBeforeEvent" INTEGER NOT NULL,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "eventId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "EventReminder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ParticipationResponse" (
    "id" TEXT NOT NULL,
    "response" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "instanceDate" TIMESTAMP(3),
    "eventId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "ParticipationResponse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationPreferences" (
    "id" TEXT NOT NULL,
    "emailNotifications" BOOLEAN NOT NULL DEFAULT true,
    "pushNotifications" BOOLEAN NOT NULL DEFAULT true,
    "eventReminders" BOOLEAN NOT NULL DEFAULT true,
    "participationQueries" BOOLEAN NOT NULL DEFAULT true,
    "reminderHoursBeforeEvent" INTEGER NOT NULL DEFAULT 24,
    "emailEventInvites" BOOLEAN NOT NULL DEFAULT true,
    "emailEventReminders" BOOLEAN NOT NULL DEFAULT true,
    "emailGroupInvites" BOOLEAN NOT NULL DEFAULT true,
    "emailDirectMessages" BOOLEAN NOT NULL DEFAULT true,
    "emailWeeklyDigest" BOOLEAN NOT NULL DEFAULT false,
    "pushNewPosts" BOOLEAN NOT NULL DEFAULT true,
    "pushEventUpdates" BOOLEAN NOT NULL DEFAULT true,
    "pushLocationAlerts" BOOLEAN NOT NULL DEFAULT true,
    "userId" TEXT NOT NULL,

    CONSTRAINT "NotificationPreferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GroupAdmin" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "groupId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "GroupAdmin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserDeviceToken" (
    "id" TEXT NOT NULL,
    "deviceToken" TEXT NOT NULL,
    "deviceType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,

    CONSTRAINT "UserDeviceToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailNotificationLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL,
    "relatedId" TEXT,

    CONSTRAINT "EmailNotificationLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecommendationFeedback" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "recommendationType" TEXT NOT NULL,
    "recommendedId" TEXT NOT NULL,
    "interaction" TEXT NOT NULL,
    "rating" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RecommendationFeedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventInstanceResponse" (
    "id" TEXT NOT NULL,
    "response" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "eventId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "EventInstanceResponse_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EventReminder_eventId_idx" ON "EventReminder"("eventId");

-- CreateIndex
CREATE INDEX "EventReminder_userId_idx" ON "EventReminder"("userId");

-- CreateIndex
CREATE INDEX "EventReminder_reminderType_idx" ON "EventReminder"("reminderType");

-- CreateIndex
CREATE INDEX "EventReminder_hoursBeforeEvent_idx" ON "EventReminder"("hoursBeforeEvent");

-- CreateIndex
CREATE INDEX "EventReminder_sentAt_idx" ON "EventReminder"("sentAt");

-- CreateIndex
CREATE INDEX "ParticipationResponse_eventId_idx" ON "ParticipationResponse"("eventId");

-- CreateIndex
CREATE INDEX "ParticipationResponse_userId_idx" ON "ParticipationResponse"("userId");

-- CreateIndex
CREATE INDEX "ParticipationResponse_response_idx" ON "ParticipationResponse"("response");

-- CreateIndex
CREATE INDEX "ParticipationResponse_instanceDate_idx" ON "ParticipationResponse"("instanceDate");

-- CreateIndex
CREATE UNIQUE INDEX "ParticipationResponse_eventId_userId_key" ON "ParticipationResponse"("eventId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "ParticipationResponse_eventId_userId_instanceDate_key" ON "ParticipationResponse"("eventId", "userId", "instanceDate");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationPreferences_userId_key" ON "NotificationPreferences"("userId");

-- CreateIndex
CREATE INDEX "NotificationPreferences_userId_idx" ON "NotificationPreferences"("userId");

-- CreateIndex
CREATE INDEX "GroupAdmin_groupId_idx" ON "GroupAdmin"("groupId");

-- CreateIndex
CREATE INDEX "GroupAdmin_userId_idx" ON "GroupAdmin"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "GroupAdmin_groupId_userId_key" ON "GroupAdmin"("groupId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserDeviceToken_deviceToken_key" ON "UserDeviceToken"("deviceToken");

-- CreateIndex
CREATE INDEX "UserDeviceToken_userId_idx" ON "UserDeviceToken"("userId");

-- CreateIndex
CREATE INDEX "UserDeviceToken_deviceType_idx" ON "UserDeviceToken"("deviceType");

-- CreateIndex
CREATE INDEX "EmailNotificationLog_userId_idx" ON "EmailNotificationLog"("userId");

-- CreateIndex
CREATE INDEX "EmailNotificationLog_email_idx" ON "EmailNotificationLog"("email");

-- CreateIndex
CREATE INDEX "EmailNotificationLog_type_idx" ON "EmailNotificationLog"("type");

-- CreateIndex
CREATE INDEX "EmailNotificationLog_sentAt_idx" ON "EmailNotificationLog"("sentAt");

-- CreateIndex
CREATE INDEX "EmailNotificationLog_status_idx" ON "EmailNotificationLog"("status");

-- CreateIndex
CREATE INDEX "EmailNotificationLog_relatedId_idx" ON "EmailNotificationLog"("relatedId");

-- CreateIndex
CREATE INDEX "RecommendationFeedback_userId_idx" ON "RecommendationFeedback"("userId");

-- CreateIndex
CREATE INDEX "RecommendationFeedback_recommendationType_idx" ON "RecommendationFeedback"("recommendationType");

-- CreateIndex
CREATE INDEX "RecommendationFeedback_recommendedId_idx" ON "RecommendationFeedback"("recommendedId");

-- CreateIndex
CREATE INDEX "RecommendationFeedback_interaction_idx" ON "RecommendationFeedback"("interaction");

-- CreateIndex
CREATE INDEX "RecommendationFeedback_createdAt_idx" ON "RecommendationFeedback"("createdAt");

-- CreateIndex
CREATE INDEX "EventInstanceResponse_eventId_idx" ON "EventInstanceResponse"("eventId");

-- CreateIndex
CREATE INDEX "EventInstanceResponse_userId_idx" ON "EventInstanceResponse"("userId");

-- CreateIndex
CREATE INDEX "EventInstanceResponse_response_idx" ON "EventInstanceResponse"("response");

-- CreateIndex
CREATE INDEX "EventInstanceResponse_date_idx" ON "EventInstanceResponse"("date");

-- CreateIndex
CREATE UNIQUE INDEX "EventInstanceResponse_userId_eventId_date_key" ON "EventInstanceResponse"("userId", "eventId", "date");

-- CreateIndex
CREATE INDEX "Group_city_state_country_idx" ON "Group"("city", "state", "country");

-- CreateIndex
CREATE INDEX "Group_activityLevel_idx" ON "Group"("activityLevel");

-- CreateIndex
CREATE INDEX "User_latitude_longitude_idx" ON "User"("latitude", "longitude");

-- CreateIndex
CREATE INDEX "User_activityLevel_idx" ON "User"("activityLevel");

-- CreateIndex
CREATE INDEX "User_city_state_country_idx" ON "User"("city", "state", "country");

-- AddForeignKey
ALTER TABLE "EventReminder" ADD CONSTRAINT "EventReminder_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventReminder" ADD CONSTRAINT "EventReminder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParticipationResponse" ADD CONSTRAINT "ParticipationResponse_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParticipationResponse" ADD CONSTRAINT "ParticipationResponse_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationPreferences" ADD CONSTRAINT "NotificationPreferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupAdmin" ADD CONSTRAINT "GroupAdmin_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupAdmin" ADD CONSTRAINT "GroupAdmin_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserDeviceToken" ADD CONSTRAINT "UserDeviceToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventInstanceResponse" ADD CONSTRAINT "EventInstanceResponse_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventInstanceResponse" ADD CONSTRAINT "EventInstanceResponse_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
