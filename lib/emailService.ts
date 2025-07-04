'use server';

import nodemailer from 'nodemailer';
import { google } from 'googleapis';
import prisma from './prisma';

// Configure OAuth2 client
const OAuth2 = google.auth.OAuth2;
const oauth2Client = new OAuth2(
  process.env.GMAIL_CLIENT_ID,
  process.env.GMAIL_CLIENT_SECRET,
  process.env.GMAIL_REDIRECT_URI
);

oauth2Client.setCredentials({
  refresh_token: process.env.GMAIL_REFRESH_TOKEN
});

// Create reusable transporter
async function createTransporter() {
  try {
    const accessToken = await oauth2Client.getAccessToken();
    
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user: process.env.EMAIL_FROM,
        clientId: process.env.GMAIL_CLIENT_ID,
        clientSecret: process.env.GMAIL_CLIENT_SECRET,
        refreshToken: process.env.GMAIL_REFRESH_TOKEN,
        accessToken: accessToken?.token || '',
      },
    });
  } catch (error) {
    console.error('Error creating email transporter:', error);
    throw new Error('Failed to create email transporter');
  }
}

// Email templates
const emailTemplates = {
  // Event participation query
  participationQuery: (eventTitle: string, eventDate: string, eventId: string, userName: string) => ({
    subject: `Wirst du an "${eventTitle}" teilnehmen?`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Hallo ${userName},</h2>
        <p>Das Event "${eventTitle}" findet am ${eventDate} statt.</p>
        <p>Wirst du teilnehmen?</p>
        <div style="margin: 30px 0;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/events/${eventId}?response=yes" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; margin-right: 10px; border-radius: 4px;">Ja</a>
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/events/${eventId}?response=no" style="background-color: #f44336; color: white; padding: 10px 20px; text-decoration: none; margin-right: 10px; border-radius: 4px;">Nein</a>
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/events/${eventId}?response=maybe" style="background-color: #ff9800; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">Vielleicht</a>
        </div>
        <p>Oder besuche die <a href="${process.env.NEXT_PUBLIC_APP_URL}/events/${eventId}">Event-Seite</a> für weitere Details.</p>
        <p>Viele Grüße,<br>Dein Community-Team</p>
      </div>
    `,
  }),
  
  // Event attendance reminder
  attendanceReminder: (eventTitle: string, eventDate: string, eventId: string, userName: string, attendeeCount: number) => ({
    subject: `Erinnerung: "${eventTitle}" findet bald statt`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Hallo ${userName},</h2>
        <p>Wir möchten dich daran erinnern, dass das Event "${eventTitle}" am ${eventDate} stattfindet.</p>
        <p>${attendeeCount} Personen haben bereits zugesagt.</p>
        <div style="margin: 30px 0;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/events/${eventId}" style="background-color: #2196F3; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">Event-Details ansehen</a>
        </div>
        <p>Viele Grüße,<br>Dein Community-Team</p>
      </div>
    `,
  }),
  
  // Welcome email
  welcome: (userName: string) => ({
    subject: `Willkommen in unserer Community!`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Willkommen, ${userName}!</h2>
        <p>Wir freuen uns, dich in unserer Community begrüßen zu dürfen.</p>
        <p>Hier kannst du:</p>
        <ul>
          <li>Gruppen beitreten oder erstellen</li>
          <li>An Events teilnehmen</li>
          <li>Neue Locations entdecken</li>
          <li>Dich mit Gleichgesinnten vernetzen</li>
        </ul>
        <div style="margin: 30px 0;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/search" style="background-color: #2196F3; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">Entdecke die Community</a>
        </div>
        <p>Viele Grüße,<br>Dein Community-Team</p>
      </div>
    `,
  }),
  
  // Group invitation
  groupInvitation: (groupName: string, inviterName: string, groupId: string, userName: string) => ({
    subject: `${inviterName} hat dich zur Gruppe "${groupName}" eingeladen`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Hallo ${userName},</h2>
        <p>${inviterName} hat dich eingeladen, der Gruppe "${groupName}" beizutreten.</p>
        <div style="margin: 30px 0;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/groups/${groupId}" style="background-color: #2196F3; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">Gruppe ansehen</a>
        </div>
        <p>Viele Grüße,<br>Dein Community-Team</p>
      </div>
    `,
  }),
} as const;

// Define types for template functions
type EmailTemplate<T extends keyof typeof emailTemplates> = typeof emailTemplates[T];

// Define types for template data
type ParticipationQueryData = {
  eventTitle: string;
  eventDate: string;
  eventId: string;
};

type AttendanceReminderData = {
  eventTitle: string;
  eventDate: string;
  eventId: string;
  attendeeCount: number;
};

type WelcomeData = {
  userName: string;
};

type GroupInvitationData = {
  groupName: string;
  inviterName: string;
  groupId: string;
};

type TemplateData = {
  participationQuery: ParticipationQueryData;
  attendanceReminder: AttendanceReminderData;
  welcome: WelcomeData;
  groupInvitation: GroupInvitationData;
};

/**
 * Send a participation query email
 */
export async function sendParticipationQueryEmail(
  userId: string,
  eventTitle: string,
  eventDate: string,
  eventId: string
) {
  await sendEmail('participationQuery', {
    userId,
    templateData: {
      eventTitle,
      eventDate,
      eventId
    }
  });
}

/**
 * Send an attendance reminder email
 */
export async function sendAttendanceReminderEmail(
  userId: string,
  eventTitle: string,
  eventDate: string,
  eventId: string,
  attendeeCount: number
) {
  await sendEmail('attendanceReminder', {
    userId,
    templateData: {
      eventTitle,
      eventDate,
      eventId,
      attendeeCount
    }
  });
}

/**
 * Send a welcome email
 */
export async function sendWelcomeEmail(
  userId: string,
  userName: string
) {
  await sendEmail('welcome', {
    userId,
    templateData: {
      userName
    }
  });
}

/**
 * Send a group invitation email
 */
export async function sendGroupInvitationEmail(
  userId: string,
  groupName: string,
  inviterName: string,
  groupId: string
) {
  await sendEmail('groupInvitation', {
    userId,
    templateData: {
      groupName,
      inviterName,
      groupId
    }
  });
}

async function sendEmail(
  templateType: keyof typeof emailTemplates,
  options: {
    userId: string;
    templateData: Record<string, string | number>;
  }
) {
  const { userId, templateData } = options;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      email: true,
      name: true,
      notificationPreferences: true
    }
  });

  if (!user?.email) {
    console.error(`No email found for user ${userId}`);
    return;
  }

  const preferences = user.notificationPreferences;
  if (!preferences?.emailNotifications) {
    console.log(`Email notifications disabled for user ${userId}`);
    return;
  }

  const template = emailTemplates[templateType];
  let content: { subject: string; html: string };

  switch (templateType) {
    case 'participationQuery': {
      const participationTemplate = template as typeof emailTemplates.participationQuery;
      content = participationTemplate(
        templateData.eventTitle as string,
        templateData.eventDate as string,
        templateData.eventId as string,
        user.name || 'User'
      );
      break;
    }
    case 'attendanceReminder': {
      const attendanceTemplate = template as typeof emailTemplates.attendanceReminder;
      content = attendanceTemplate(
        templateData.eventTitle as string,
        templateData.eventDate as string,
        templateData.eventId as string,
        user.name || 'User',
        templateData.attendeeCount as number
      );
      break;
    }
    case 'welcome': {
      const welcomeTemplate = template as typeof emailTemplates.welcome;
      content = welcomeTemplate(user.name || 'User');
      break;
    }
    case 'groupInvitation': {
      const invitationTemplate = template as typeof emailTemplates.groupInvitation;
      content = invitationTemplate(
        templateData.groupName as string,
        templateData.inviterName as string,
        templateData.groupId as string,
        user.name || 'User'
      );
      break;
    }
    default:
      throw new Error(`Unsupported email template: ${templateType}`);
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: true,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: user.email,
      subject: content.subject,
      html: content.html
    });
    console.log(`Email sent successfully to ${user.email}`);
  } catch (error) {
    console.error(`Failed to send email to ${user.email}:`, error);
  }
}

/**
 * Send participation query emails to all members of a group for an event
 * @param eventId The ID of the event
 * @param hoursBeforeEvent How many hours before the event to send the email
 */
export async function sendParticipationQueries(eventId: string, hoursBeforeEvent: number) {
  try {
    // Get the event with group and attendees
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        group: {
          include: {
            members: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!event) {
      throw new Error('Event not found');
    }

    // If the event is not part of a group, there's no one to query
    if (!event.group) {
      return;
    }

    // Format the event date
    const eventDate = new Date(event.startTime).toLocaleDateString('de-DE', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    // Send emails to all group members
    const emailPromises = event.group.members.map(async (member: { id: string, email: string | null, name: string | null }) => {
      if (!member.email) return;

      try {
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

        // Send the email
        await sendEmail('participationQuery', {
          userId: member.id,
          templateData: {
            eventTitle: event.title,
            eventDate,
            eventId: event.id,
            userName: member.name || 'User'
          }
        });
      } catch (error) {
        console.error(`Error sending participation query to ${member.id}:`, error);
      }
    });

    await Promise.all(emailPromises);
    console.log(`Sent participation queries for event ${eventId} to ${emailPromises.length} members`);
  } catch (error) {
    console.error('Error sending participation queries:', error);
    throw new Error('Failed to send participation queries');
  }
}

/**
 * Send attendance reminder emails to users who have responded "yes" to an event
 * @param eventId The ID of the event
 * @param hoursBeforeEvent How many hours before the event to send the email
 */
export async function sendAttendanceReminders(eventId: string, hoursBeforeEvent: number) {
  try {
    // Get the event with attendees
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        attendees: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        participationResponses: {
          where: {
            response: 'yes',
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!event) {
      throw new Error('Event not found');
    }

    // Combine attendees and users who responded "yes"
    const attendees = [
      ...event.attendees,
      ...event.participationResponses.map(response => response.user),
    ];

    // Remove duplicates
    const uniqueAttendees = Array.from(
      new Map(attendees.map(attendee => [attendee.id, attendee])).values()
    );

    // Format the event date
    const eventDate = new Date(event.startTime).toLocaleDateString('de-DE', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    // Send emails to all attendees
    const emailPromises = uniqueAttendees.map(async (attendee: { id: string, email: string | null, name: string | null }) => {
      if (!attendee.email) return;

      try {
        // Create a reminder record
        await prisma.eventReminder.create({
          data: {
            eventId: event.id,
            userId: attendee.id,
            reminderType: 'attendance_reminder',
            hoursBeforeEvent,
            sentAt: new Date(),
          },
        });

        // Send the email
        await sendEmail('attendanceReminder', {
          userId: attendee.id,
          templateData: {
            eventTitle: event.title,
            eventDate,
            eventId: event.id,
            userName: attendee.name || 'User',
            attendeeCount: uniqueAttendees.length
          }
        });
      } catch (error) {
        console.error(`Error sending attendance reminder to ${attendee.id}:`, error);
      }
    });

    await Promise.all(emailPromises);
    console.log(`Sent attendance reminders for event ${eventId} to ${emailPromises.length} attendees`);
  } catch (error) {
    console.error('Error sending attendance reminders:', error);
    throw new Error('Failed to send attendance reminders');
  }
} 