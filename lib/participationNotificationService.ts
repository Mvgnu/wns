import { prisma } from './prisma';
import { sendNotificationToUser } from './notificationService';
import { Prisma } from '@prisma/client';
import { sendParticipationQueryEmail, sendAttendanceReminderEmail } from './emailService';

/**
 * Send participation query notifications to users with undetermined attendance status
 * @param hoursBeforeEvent The number of hours before the event (48 or 24)
 */
export async function sendParticipationQueryNotifications(hoursBeforeEvent: number) {
  try {
    if (hoursBeforeEvent !== 48 && hoursBeforeEvent !== 24) {
      throw new Error(`Invalid hours parameter: ${hoursBeforeEvent}. Only 48 or 24 are supported.`);
    }

    // Calculate the time range to look for events
    const now = new Date();
    const targetTime = new Date(now.getTime() + hoursBeforeEvent * 60 * 60 * 1000);
    
    // Buffer time (5 minutes) to avoid missing events due to slight timing differences
    const bufferMinutes = 5;
    const lowerBound = new Date(targetTime.getTime() - bufferMinutes * 60 * 1000);
    const upperBound = new Date(targetTime.getTime() + bufferMinutes * 60 * 1000);

    // Find upcoming events that are exactly 48 or 24 hours away
    const upcomingEvents = await prisma.event.findMany({
      where: {
        startTime: {
          gte: lowerBound,
          lte: upperBound,
        },
      },
      include: {
        group: {
          include: {
            members: {
              select: {
                id: true,
                email: true,
                name: true,
                notificationPreferences: true,
              },
            },
          },
        },
        participationResponses: {
          select: {
            userId: true,
            response: true,
          },
        },
        attendees: {
          select: {
            id: true,
          },
        },
      },
    });

    console.log(`Found ${upcomingEvents.length} events happening in ${hoursBeforeEvent} hours`);

    let notificationCount = 0;

    // For each event, collect users that need notifications
    for (const event of upcomingEvents) {
      // Skip if event has no group
      if (!event.group) continue;

      // Collect all group members
      const groupMembers = event.group.members;

      // Check each member's notification preferences and current response status
      for (const member of groupMembers) {
        // Check if the user already has a participation response
        const existingResponse = event.participationResponses.find(
          (response) => response.userId === member.id
        );
        
        // Check if user is already attending
        const isAttending = event.attendees.some(
          (attendee) => attendee.id === member.id
        );
        
        // Only send notification if no response and not attending
        if (!existingResponse && !isAttending) {
          // Check if a reminder has already been sent for this event/user/hour combination
          const existingReminder = await prisma.eventReminder.findFirst({
            where: {
              eventId: event.id,
              userId: member.id,
              reminderType: 'participation_query',
              hoursBeforeEvent,
            },
          });

          if (!existingReminder) {
            // Create a reminder record
            await prisma.eventReminder.create({
              data: {
                eventId: event.id,
                userId: member.id,
                reminderType: 'participation_query',
                hoursBeforeEvent,
                sentAt: new Date(),
              },
            });

            // Format event date
            const eventDate = new Date(event.startTime).toLocaleDateString('de-DE', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });

            // Create and send in-app notification
            const notificationData: Prisma.NotificationCreateInput = {
              user: { connect: { id: member.id } },
              type: 'EVENT_ATTENDANCE_QUERY',
              message: `Wirst du an "${event.title}" in ${hoursBeforeEvent} Stunden teilnehmen?`,
              linkUrl: `/events/${event.id}`,
              read: false,
              relatedId: event.id,
              requiresAction: true,
            };

            const notification = await prisma.notification.create({
              data: notificationData,
            });

            // Send real-time notification
            sendNotificationToUser(member.id, notification);
            notificationCount++;

            // Send email notification if enabled
            if (member.notificationPreferences?.emailNotifications && 
                member.notificationPreferences?.emailEventReminders) {
              await sendParticipationQueryEmail(
                event.id,
                event.title,
                eventDate,
                member.id
              );
            }
          }
        }
      }
    }

    console.log(`Sent ${notificationCount} participation query notifications for events in ${hoursBeforeEvent} hours`);
    return notificationCount;
  } catch (error) {
    console.error(`Error sending participation query notifications (${hoursBeforeEvent} hours):`, error);
    throw error;
  }
}

export async function sendParticipationNotifications() {
  try {
    // Get all upcoming events that are part of groups
    const events = await prisma.event.findMany({
      where: {
        startTime: {
          gt: new Date(),
        },
        group: {
          isNot: null,
        },
      },
      include: {
        group: {
          include: {
            members: true,
          },
        },
        attendees: true,
      },
    });

    for (const event of events) {
      // Calculate hours until event
      const hoursUntilEvent = Math.round(
        (event.startTime.getTime() - new Date().getTime()) / (1000 * 60 * 60)
      );

      // Send participation queries 24 hours before the event
      if (hoursUntilEvent === 24) {
        await sendParticipationQueryEmail(event.id, event.title, event.startTime.toLocaleDateString(), event.id);
      }

      // Send attendance reminders 1 hour before the event
      if (hoursUntilEvent === 1) {
        await sendAttendanceReminderEmail(event.id, event.title, event.startTime.toLocaleDateString(), event.id, event.attendees.length);
      }
    }
  } catch (error) {
    console.error('Error sending participation notifications:', error);
  }
} 