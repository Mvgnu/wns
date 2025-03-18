// WebSocket connection map: userId -> Set of WebSocket connections
const connections = new Map<string, Set<WebSocket>>();

// Helper function to add a connection for a user
export function addConnection(userId: string, socket: WebSocket) {
  if (!connections.has(userId)) {
    connections.set(userId, new Set());
  }
  connections.get(userId)?.add(socket);
}

// Helper function to remove a connection for a user
export function removeConnection(userId: string, socket: WebSocket) {
  connections.get(userId)?.delete(socket);
  if (connections.get(userId)?.size === 0) {
    connections.delete(userId);
  }
}

// Helper function to send notification to a user
export function sendNotificationToUser(userId: string, notification: any) {
  const userConnections = connections.get(userId);
  if (!userConnections) return;

  const message = JSON.stringify({
    type: 'notification',
    data: notification
  });

  // Send to all active connections for this user
  userConnections.forEach((socket) => {
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(message);
    }
  });
}

import { prisma } from "./prisma";
import { addDays, isBefore, startOfDay } from "date-fns";

// Function to create and send event reminder notifications
export async function sendEventReminders() {
  try {
    // Find events happening in the next 24 hours
    const tomorrow = addDays(new Date(), 1);
    const today = startOfDay(new Date());
    
    const upcomingEvents = await prisma.event.findMany({
      where: {
        startTime: {
          gte: today,
          lt: tomorrow,
        },
      },
      include: {
        organizer: {
          select: {
            id: true,
            name: true,
          },
        },
        group: {
          select: {
            id: true,
            name: true,
          },
        },
        attendees: {
          select: {
            id: true,
          },
        },
      },
    });
    
    // Create and send notifications for attendees
    for (const event of upcomingEvents) {
      const eventTime = new Date(event.startTime);
      const groupText = event.group ? ` in ${event.group.name}` : '';
      const message = `Reminder: "${event.title}"${groupText} starts tomorrow at ${eventTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
      
      // Create notifications for all attendees
      for (const attendee of event.attendees) {
        // Skip if reminder already sent
        const existingReminder = await prisma.notification.findFirst({
          where: {
            userId: attendee.id,
            type: "EVENT_REMINDER",
            relatedId: event.id,
          },
        });
        
        if (existingReminder) continue;
        
        // Create the notification
        const notification = await prisma.notification.create({
          data: {
            userId: attendee.id,
            type: "EVENT_REMINDER",
            message,
            read: false,
            relatedId: event.id,
            linkUrl: `/events/${event.id}`,
            actorId: null,
          },
        });
        
        // Send real-time notification if user is online
        sendNotificationToUser(attendee.id, notification);
      }
    }
  } catch (error) {
    console.error("Error sending event reminders:", error);
  }
}

// Function to check and create instances of recurring events
export async function generateRecurringEventInstances() {
  try {
    // Find recurring events that might need more instances
    const recurringEvents = await prisma.event.findMany({
      where: {
        isRecurring: true,
        recurringPattern: { not: null },
        recurringDays: { isEmpty: false },
        OR: [
          { recurringEndDate: { gt: new Date() } },
          { recurringEndDate: null },
        ],
        parentEventId: null, // Only template events, not instances
      },
    });
    
    const thirtyDaysFromNow = addDays(new Date(), 30);
    
    for (const template of recurringEvents) {
      // Find the latest instance
      const latestInstance = await prisma.event.findFirst({
        where: {
          parentEventId: template.id,
        },
        orderBy: {
          startTime: 'desc',
        },
      });
      
      // Check if we need to generate more instances
      if (!latestInstance || isBefore(latestInstance.startTime, thirtyDaysFromNow)) {
        // We need to generate more instances
        // Implement this with appropriate logic for your application
        console.log(`Need to generate more instances for recurring event: ${template.id}`);
        
        // Call the generation function from your API logic
        // This is a placeholder - actual implementation would be in the events API
      }
    }
  } catch (error) {
    console.error("Error generating recurring event instances:", error);
  }
} 