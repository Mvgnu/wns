"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.addConnection = addConnection;
exports.removeConnection = removeConnection;
exports.sendNotificationToUser = sendNotificationToUser;
exports.sendEventReminders = sendEventReminders;
exports.generateRecurringEventInstances = generateRecurringEventInstances;
// WebSocket connection map: userId -> Set of WebSocket connections
const connections = new Map();
// Helper function to add a connection for a user
function addConnection(userId, socket) {
    var _a;
    if (!connections.has(userId)) {
        connections.set(userId, new Set());
    }
    (_a = connections.get(userId)) === null || _a === void 0 ? void 0 : _a.add(socket);
}
// Helper function to remove a connection for a user
function removeConnection(userId, socket) {
    var _a, _b;
    (_a = connections.get(userId)) === null || _a === void 0 ? void 0 : _a.delete(socket);
    if (((_b = connections.get(userId)) === null || _b === void 0 ? void 0 : _b.size) === 0) {
        connections.delete(userId);
    }
}
// Helper function to send notification to a user
function sendNotificationToUser(userId, notification) {
    const userConnections = connections.get(userId);
    if (!userConnections)
        return;
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
const prisma_1 = __importDefault(require("./prisma"));
const date_fns_1 = require("date-fns");
// Function to create and send event reminder notifications
async function sendEventReminders() {
    try {
        // Find events happening in the next 24 hours
        const tomorrow = (0, date_fns_1.addDays)(new Date(), 1);
        const today = (0, date_fns_1.startOfDay)(new Date());
        const upcomingEvents = await prisma_1.default.event.findMany({
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
                const existingReminder = await prisma_1.default.notification.findFirst({
                    where: {
                        userId: attendee.id,
                        type: "EVENT_REMINDER",
                        relatedId: event.id,
                    },
                });
                if (existingReminder)
                    continue;
                // Create the notification
                const notification = await prisma_1.default.notification.create({
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
    }
    catch (error) {
        console.error("Error sending event reminders:", error);
    }
}
// Function to check and create instances of recurring events
async function generateRecurringEventInstances() {
    try {
        // Find recurring events that might need more instances
        const recurringEvents = await prisma_1.default.event.findMany({
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
        const thirtyDaysFromNow = (0, date_fns_1.addDays)(new Date(), 30);
        for (const template of recurringEvents) {
            // Find the latest instance
            const latestInstance = await prisma_1.default.event.findFirst({
                where: {
                    parentEventId: template.id,
                },
                orderBy: {
                    startTime: 'desc',
                },
            });
            // Check if we need to generate more instances
            if (!latestInstance || (0, date_fns_1.isBefore)(latestInstance.startTime, thirtyDaysFromNow)) {
                // We need to generate more instances
                // Implement this with appropriate logic for your application
                console.log(`Need to generate more instances for recurring event: ${template.id}`);
                // Call the generation function from your API logic
                // This is a placeholder - actual implementation would be in the events API
            }
        }
    }
    catch (error) {
        console.error("Error generating recurring event instances:", error);
    }
}
