"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startCronScheduler = startCronScheduler;
exports.stopCronScheduler = stopCronScheduler;
exports.runJobManually = runJobManually;
const node_cron_1 = __importDefault(require("node-cron"));
const participationNotificationService_1 = require("./participationNotificationService");
/**
 * Valid schedule patterns for cron jobs
 * - 48_HOUR_REMINDER: Runs daily at 09:00 AM
 * - 24_HOUR_REMINDER: Runs daily at 10:00 AM
 */
const SCHEDULE_PATTERNS = {
    // At 09:00 AM every day for 48-hour reminders
    FORTY_EIGHT_HOUR_REMINDER: '0 9 * * *',
    // At 10:00 AM every day for 24-hour reminders
    TWENTY_FOUR_HOUR_REMINDER: '0 10 * * *'
};
/**
 * Map of active cron jobs
 */
const cronJobs = new Map();
/**
 * Start the cron scheduler for event reminders
 */
function startCronScheduler() {
    console.log('🕒 Starting cron scheduler for event reminders...');
    // Stop any previously running jobs
    stopCronScheduler();
    // Schedule 48-hour reminders (daily at 9 AM)
    const fortyEightHourJob = node_cron_1.default.schedule(SCHEDULE_PATTERNS.FORTY_EIGHT_HOUR_REMINDER, async () => {
        console.log('🔔 Running 48-hour event reminder notifications');
        try {
            await (0, participationNotificationService_1.sendParticipationNotifications)();
            console.log('✅ Sent 48-hour event reminder notifications');
        }
        catch (error) {
            console.error('❌ Error sending 48-hour event reminders:', error);
        }
    });
    // Schedule 24-hour reminders (daily at 10 AM)
    const twentyFourHourJob = node_cron_1.default.schedule(SCHEDULE_PATTERNS.TWENTY_FOUR_HOUR_REMINDER, async () => {
        console.log('🔔 Running 24-hour event reminder notifications');
        try {
            await (0, participationNotificationService_1.sendParticipationNotifications)();
            console.log('✅ Sent 24-hour event reminder notifications');
        }
        catch (error) {
            console.error('❌ Error sending 24-hour event reminders:', error);
        }
    });
    // Store the scheduled jobs
    cronJobs.set('48_HOUR_REMINDER', fortyEightHourJob);
    cronJobs.set('24_HOUR_REMINDER', twentyFourHourJob);
    console.log('✅ Cron scheduler started successfully');
}
/**
 * Stop all running cron jobs
 */
function stopCronScheduler() {
    console.log('🛑 Stopping all cron jobs...');
    // Stop each job
    cronJobs.forEach((job, name) => {
        job.stop();
        console.log(`✅ Stopped cron job: ${name}`);
    });
    // Clear the map
    cronJobs.clear();
}
/**
 * Run a specific job immediately (for testing or manual execution)
 */
async function runJobManually(jobType) {
    console.log(`🔄 Manually running job: ${jobType}`);
    try {
        await (0, participationNotificationService_1.sendParticipationNotifications)();
        console.log(`✅ Manually sent ${jobType} event reminder notifications`);
    }
    catch (error) {
        console.error(`❌ Error manually running ${jobType}:`, error);
        throw error;
    }
}
