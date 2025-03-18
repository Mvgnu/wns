import nodemailer from 'nodemailer';
import { google } from 'googleapis';
import { prisma } from '@/lib/prisma';
import { Event, User, Group } from '@prisma/client';
import { format } from 'date-fns';

// Configure OAuth2 client for Gmail
const OAuth2 = google.auth.OAuth2;
const oauth2Client = new OAuth2(
  process.env.GMAIL_CLIENT_ID,
  process.env.GMAIL_CLIENT_SECRET,
  'https://developers.google.com/oauthplayground'
);

oauth2Client.setCredentials({
  refresh_token: process.env.GMAIL_REFRESH_TOKEN
});

// Create transporter for sending emails
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
    throw error;
  }
}

// Log email notification
async function logEmailNotification(userId: string, email: string, type: string, relatedId?: string) {
  try {
    await prisma.emailNotificationLog.create({
      data: {
        userId,
        email,
        type,
        status: 'sent',
        relatedId,
      },
    });
  } catch (error) {
    console.error('Error logging email notification:', error);
  }
}

// Send event reminder email
export async function sendEventReminderEmail(user: User, event: Event) {
  try {
    // Check if user has email notifications enabled
    const preferences = await prisma.notificationPreferences.findUnique({
      where: { userId: user.id },
    });

    if (!preferences?.emailNotifications || !preferences?.emailEventReminders) {
      return;
    }

    if (!user.email) {
      console.error(`User ${user.id} has no email address`);
      return;
    }

    const transporter = await createTransporter();
    
    const eventDate = format(event.startTime, 'EEEE, MMMM do, yyyy');
    const eventTime = format(event.startTime, 'h:mm a');
    
    const mailOptions = {
      from: `Community Site <${process.env.EMAIL_FROM}>`,
      to: user.email,
      subject: `Reminder: ${event.title} on ${eventDate}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Event Reminder</h2>
          <p>Hello ${user.name || 'there'},</p>
          <p>This is a reminder for the upcoming event:</p>
          <div style="padding: 15px; background-color: #f5f5f5; border-radius: 8px; margin: 15px 0;">
            <h3 style="margin-top: 0;">${event.title}</h3>
            <p><strong>Date:</strong> ${eventDate}</p>
            <p><strong>Time:</strong> ${eventTime}</p>
            ${event.description ? `<p><strong>Description:</strong> ${event.description}</p>` : ''}
          </div>
          <p>We look forward to seeing you there!</p>
          <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/events/${event.id}" style="display: inline-block; padding: 10px 20px; background-color: #4a7aff; color: white; text-decoration: none; border-radius: 5px;">View Event Details</a></p>
          <p style="color: #888; font-size: 12px; margin-top: 30px;">
            If you no longer wish to receive these emails, you can update your 
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/profile/settings">notification settings</a>.
          </p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    await logEmailNotification(user.id, user.email, 'event_reminder', event.id);
    
  } catch (error) {
    console.error('Error sending event reminder email:', error);
  }
}

// Send group invitation email
export async function sendGroupInviteEmail(invitedUser: User, group: Group, invitedBy: User) {
  try {
    // Check if user has email notifications enabled
    const preferences = await prisma.notificationPreferences.findUnique({
      where: { userId: invitedUser.id },
    });

    if (!preferences?.emailNotifications || !preferences?.emailGroupInvites) {
      return;
    }

    if (!invitedUser.email) {
      console.error(`User ${invitedUser.id} has no email address`);
      return;
    }

    const transporter = await createTransporter();
    
    const mailOptions = {
      from: `Community Site <${process.env.EMAIL_FROM}>`,
      to: invitedUser.email,
      subject: `You've been invited to join ${group.name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Group Invitation</h2>
          <p>Hello ${invitedUser.name || 'there'},</p>
          <p>${invitedBy.name || 'Someone'} has invited you to join the group "${group.name}".</p>
          <div style="padding: 15px; background-color: #f5f5f5; border-radius: 8px; margin: 15px 0;">
            <h3 style="margin-top: 0;">${group.name}</h3>
            <p><strong>Sport:</strong> ${group.sport}</p>
            ${group.description ? `<p><strong>Description:</strong> ${group.description}</p>` : ''}
            ${group.location ? `<p><strong>Location:</strong> ${group.location}</p>` : ''}
          </div>
          <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/groups/${group.id}" style="display: inline-block; padding: 10px 20px; background-color: #4a7aff; color: white; text-decoration: none; border-radius: 5px;">View Group</a></p>
          <p style="color: #888; font-size: 12px; margin-top: 30px;">
            If you no longer wish to receive these emails, you can update your 
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/profile/settings">notification settings</a>.
          </p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    await logEmailNotification(invitedUser.id, invitedUser.email, 'group_invite', group.id);
    
  } catch (error) {
    console.error('Error sending group invite email:', error);
  }
}

// Send participation query email
export async function sendParticipationQueryEmail(user: User, event: Event) {
  try {
    // Check if user has email notifications enabled
    const preferences = await prisma.notificationPreferences.findUnique({
      where: { userId: user.id },
    });

    if (!preferences?.emailNotifications || !preferences?.participationQueries) {
      return;
    }

    if (!user.email) {
      console.error(`User ${user.id} has no email address`);
      return;
    }

    const transporter = await createTransporter();
    
    const eventDate = format(event.startTime, 'EEEE, MMMM do, yyyy');
    const eventTime = format(event.startTime, 'h:mm a');
    
    const mailOptions = {
      from: `Community Site <${process.env.EMAIL_FROM}>`,
      to: user.email,
      subject: `Will you attend ${event.title}?`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Event Participation</h2>
          <p>Hello ${user.name || 'there'},</p>
          <p>We'd like to know if you'll be attending the following event:</p>
          <div style="padding: 15px; background-color: #f5f5f5; border-radius: 8px; margin: 15px 0;">
            <h3 style="margin-top: 0;">${event.title}</h3>
            <p><strong>Date:</strong> ${eventDate}</p>
            <p><strong>Time:</strong> ${eventTime}</p>
            ${event.description ? `<p><strong>Description:</strong> ${event.description}</p>` : ''}
          </div>
          <p>Please let us know if you can attend:</p>
          <p>
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/events/${event.id}?respond=yes" style="display: inline-block; padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px; margin-right: 10px;">Yes, I'll attend</a>
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/events/${event.id}?respond=maybe" style="display: inline-block; padding: 10px 20px; background-color: #FFC107; color: white; text-decoration: none; border-radius: 5px; margin-right: 10px;">Maybe</a>
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/events/${event.id}?respond=no" style="display: inline-block; padding: 10px 20px; background-color: #F44336; color: white; text-decoration: none; border-radius: 5px;">No, I can't attend</a>
          </p>
          <p style="color: #888; font-size: 12px; margin-top: 30px;">
            If you no longer wish to receive these emails, you can update your 
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/profile/settings">notification settings</a>.
          </p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    await logEmailNotification(user.id, user.email, 'participation_query', event.id);
    
  } catch (error) {
    console.error('Error sending participation query email:', error);
  }
}

// Send weekly digest email
export async function sendWeeklyDigestEmail(user: User, upcomingEvents: Event[], newGroups: Group[]) {
  try {
    // Check if user has email notifications enabled
    const preferences = await prisma.notificationPreferences.findUnique({
      where: { userId: user.id },
    });

    if (!preferences?.emailNotifications || !preferences?.emailWeeklyDigest) {
      return;
    }

    if (!user.email) {
      console.error(`User ${user.id} has no email address`);
      return;
    }

    const transporter = await createTransporter();
    
    let eventsHtml = '';
    if (upcomingEvents.length > 0) {
      eventsHtml = `
        <h3>Your Upcoming Events</h3>
        <div>
          ${upcomingEvents.map(event => `
            <div style="padding: 10px; background-color: #f5f5f5; border-radius: 8px; margin-bottom: 10px;">
              <h4 style="margin-top: 0;">${event.title}</h4>
              <p><strong>Date:</strong> ${format(event.startTime, 'EEEE, MMMM do, yyyy')}</p>
              <p><strong>Time:</strong> ${format(event.startTime, 'h:mm a')}</p>
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/events/${event.id}" style="color: #4a7aff;">View details</a>
            </div>
          `).join('')}
        </div>
      `;
    }
    
    let groupsHtml = '';
    if (newGroups.length > 0) {
      groupsHtml = `
        <h3>New Groups You Might Like</h3>
        <div>
          ${newGroups.map(group => `
            <div style="padding: 10px; background-color: #f5f5f5; border-radius: 8px; margin-bottom: 10px;">
              <h4 style="margin-top: 0;">${group.name}</h4>
              <p><strong>Sport:</strong> ${group.sport}</p>
              ${group.description ? `<p>${group.description.substring(0, 100)}${group.description.length > 100 ? '...' : ''}</p>` : ''}
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/groups/${group.id}" style="color: #4a7aff;">View group</a>
            </div>
          `).join('')}
        </div>
      `;
    }
    
    const mailOptions = {
      from: `Community Site <${process.env.EMAIL_FROM}>`,
      to: user.email,
      subject: `Your Weekly Community Update`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Weekly Digest</h2>
          <p>Hello ${user.name || 'there'},</p>
          <p>Here's what's happening in your community this week:</p>
          
          ${eventsHtml}
          ${groupsHtml}
          
          <p><a href="${process.env.NEXT_PUBLIC_APP_URL}" style="display: inline-block; padding: 10px 20px; background-color: #4a7aff; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px;">Visit Community Site</a></p>
          
          <p style="color: #888; font-size: 12px; margin-top: 30px;">
            If you no longer wish to receive these emails, you can update your 
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/profile/settings">notification settings</a>.
          </p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    await logEmailNotification(user.id, user.email, 'weekly_digest');
    
  } catch (error) {
    console.error('Error sending weekly digest email:', error);
  }
} 