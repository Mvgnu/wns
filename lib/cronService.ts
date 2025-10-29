import cron from 'node-cron';
import { sendParticipationNotifications } from './participationNotificationService';
import { sweepWaitlistsForUpcomingEvents } from './events/rsvp';
import { generateDailyAnalyticsSnapshot } from './analytics/aggregator';

/**
 * Valid schedule patterns for cron jobs
 * - 48_HOUR_REMINDER: Runs daily at 09:00 AM
 * - 24_HOUR_REMINDER: Runs daily at 10:00 AM
 */

const SCHEDULE_PATTERNS = {
  // At 09:00 AM every day for 48-hour reminders
  FORTY_EIGHT_HOUR_REMINDER: '0 9 * * *',

  // At 10:00 AM every day for 24-hour reminders
  TWENTY_FOUR_HOUR_REMINDER: '0 10 * * *',

  // Every 30 minutes to promote waitlisted attendees when spots free up
  WAITLIST_SWEEP: '*/30 * * * *',

  // At 02:15 AM every day to aggregate analytics metrics
  DAILY_ANALYTICS: '15 2 * * *'
};

/**
 * Map of active cron jobs
 */
const cronJobs: Map<string, cron.ScheduledTask> = new Map();

/**
 * Start the cron scheduler for event reminders
 */
export function startCronScheduler() {
  console.log('🕒 Starting cron scheduler for event reminders...');
  
  // Stop any previously running jobs
  stopCronScheduler();
  
  // Schedule 48-hour reminders (daily at 9 AM)
  const fortyEightHourJob = cron.schedule(SCHEDULE_PATTERNS.FORTY_EIGHT_HOUR_REMINDER, async () => {
    console.log('🔔 Running 48-hour event reminder notifications');
    try {
      await sendParticipationNotifications();
      console.log('✅ Sent 48-hour event reminder notifications');
    } catch (error) {
      console.error('❌ Error sending 48-hour event reminders:', error);
    }
  });
  
  // Schedule 24-hour reminders (daily at 10 AM)
  const twentyFourHourJob = cron.schedule(SCHEDULE_PATTERNS.TWENTY_FOUR_HOUR_REMINDER, async () => {
    console.log('🔔 Running 24-hour event reminder notifications');
    try {
      await sendParticipationNotifications();
      console.log('✅ Sent 24-hour event reminder notifications');
    } catch (error) {
      console.error('❌ Error sending 24-hour event reminders:', error);
    }
  });

  const waitlistSweepJob = cron.schedule(SCHEDULE_PATTERNS.WAITLIST_SWEEP, async () => {
    console.log('🔁 Running waitlist sweep for upcoming events');
    try {
      const promotions = await sweepWaitlistsForUpcomingEvents(12);
      if (promotions.length > 0) {
        console.log(`✅ Promoted ${promotions.reduce((total, entry) => total + entry.promoted, 0)} attendees from waitlists`);
      } else {
        console.log('ℹ️ No waitlisted attendees ready for promotion');
      }
    } catch (error) {
      console.error('❌ Error while sweeping waitlists:', error);
    }
  });

  const analyticsJob = cron.schedule(SCHEDULE_PATTERNS.DAILY_ANALYTICS, async () => {
    console.log('📊 Running daily analytics aggregation');
    try {
      const result = await generateDailyAnalyticsSnapshot();
      console.log(`✅ Analytics snapshot stored for ${result.groupCount} groups`);
    } catch (error) {
      console.error('❌ Error while aggregating analytics metrics:', error);
    }
  });

  // Store the scheduled jobs
  cronJobs.set('48_HOUR_REMINDER', fortyEightHourJob);
  cronJobs.set('24_HOUR_REMINDER', twentyFourHourJob);
  cronJobs.set('WAITLIST_SWEEP', waitlistSweepJob);
  cronJobs.set('DAILY_ANALYTICS', analyticsJob);
  
  console.log('✅ Cron scheduler started successfully');
}

/**
 * Stop all running cron jobs
 */
export function stopCronScheduler() {
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
export async function runJobManually(
  jobType: '48_HOUR_REMINDER' | '24_HOUR_REMINDER' | 'WAITLIST_SWEEP' | 'DAILY_ANALYTICS'
) {
  console.log(`🔄 Manually running job: ${jobType}`);

  try {
    if (jobType === 'WAITLIST_SWEEP') {
      const promotions = await sweepWaitlistsForUpcomingEvents(12);
      console.log('✅ Waitlist sweep completed', promotions);
    } else if (jobType === 'DAILY_ANALYTICS') {
      const result = await generateDailyAnalyticsSnapshot();
      console.log('✅ Daily analytics snapshot complete', result);
    } else {
      await sendParticipationNotifications();
      console.log(`✅ Manually sent ${jobType} event reminder notifications`);
    }
  } catch (error) {
    console.error(`❌ Error manually running ${jobType}:`, error);
    throw error;
  }
}