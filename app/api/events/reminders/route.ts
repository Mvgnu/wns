import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";

// Schema for creating event reminders
const reminderSchema = z.object({
  eventId: z.string().min(1, "Event ID is required"),
  reminderType: z.enum(["participation_query", "attendance_reminder"], {
    errorMap: () => ({ message: "Reminder type must be 'participation_query' or 'attendance_reminder'" }),
  }),
  hoursBeforeEvent: z.number().int().min(1, "Hours must be at least 1").max(168, "Hours cannot exceed 168 (1 week)"),
});

// POST handler for creating event reminders
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const validatedData = reminderSchema.parse(body);

    // Check if the event exists
    const event = await prisma.event.findUnique({
      where: { id: validatedData.eventId },
      include: {
        group: true,
      },
    });

    if (!event) {
      return NextResponse.json(
        { error: "Event not found" },
        { status: 404 }
      );
    }

    // Check if the user is allowed to set reminders for this event
    // Only the event organizer or group owner can set reminders
    const canSetReminders = 
      event.organizerId === session.user.id ||
      (event.group && event.group.ownerId === session.user.id);

    if (!canSetReminders) {
      return NextResponse.json(
        { error: "You are not authorized to set reminders for this event" },
        { status: 403 }
      );
    }

    // Create the reminder
    const reminder = await prisma.eventReminder.create({
      data: {
        eventId: validatedData.eventId,
        userId: session.user.id,
        reminderType: validatedData.reminderType,
        hoursBeforeEvent: validatedData.hoursBeforeEvent,
      },
    });

    return NextResponse.json({
      success: true,
      data: reminder,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors },
        { status: 400 }
      );
    }
    
    console.error("Error creating event reminder:", error);
    return NextResponse.json(
      { error: "Failed to create event reminder" },
      { status: 500 }
    );
  }
}

// GET handler for retrieving event reminders
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get("eventId");

    if (!eventId) {
      return NextResponse.json(
        { error: "Event ID is required" },
        { status: 400 }
      );
    }

    // Check if the event exists
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        group: true,
      },
    });

    if (!event) {
      return NextResponse.json(
        { error: "Event not found" },
        { status: 404 }
      );
    }

    // Check if the user is allowed to view reminders for this event
    // Only the event organizer or group owner can view reminders
    const canViewReminders = 
      event.organizerId === session.user.id ||
      (event.group && event.group.ownerId === session.user.id);

    if (!canViewReminders) {
      return NextResponse.json(
        { error: "You are not authorized to view reminders for this event" },
        { status: 403 }
      );
    }

    // Get all reminders for the event
    const reminders = await prisma.eventReminder.findMany({
      where: { eventId },
      orderBy: {
        hoursBeforeEvent: "asc",
      },
    });

    return NextResponse.json({
      reminders,
    });
  } catch (error) {
    console.error("Error retrieving event reminders:", error);
    return NextResponse.json(
      { error: "Failed to retrieve event reminders" },
      { status: 500 }
    );
  }
}

// DELETE handler for removing event reminders
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const reminderId = searchParams.get("id");

    if (!reminderId) {
      return NextResponse.json(
        { error: "Reminder ID is required" },
        { status: 400 }
      );
    }

    // Check if the reminder exists
    const reminder = await prisma.eventReminder.findUnique({
      where: { id: reminderId },
      include: {
        event: {
          include: {
            group: true,
          },
        },
      },
    });

    if (!reminder) {
      return NextResponse.json(
        { error: "Reminder not found" },
        { status: 404 }
      );
    }

    // Check if the user is allowed to delete this reminder
    // Only the event organizer, reminder creator, or group owner can delete reminders
    const canDeleteReminder = 
      reminder.userId === session.user.id ||
      reminder.event.organizerId === session.user.id ||
      (reminder.event.group && reminder.event.group.ownerId === session.user.id);

    if (!canDeleteReminder) {
      return NextResponse.json(
        { error: "You are not authorized to delete this reminder" },
        { status: 403 }
      );
    }

    // Delete the reminder
    await prisma.eventReminder.delete({
      where: { id: reminderId },
    });

    return NextResponse.json({
      success: true,
      message: "Reminder deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting event reminder:", error);
    return NextResponse.json(
      { error: "Failed to delete event reminder" },
      { status: 500 }
    );
  }
} 