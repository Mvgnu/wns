export const dynamic = "force-static";
import { NextRequest, NextResponse } from "next/server";
import { sendParticipationQueryNotifications } from "@/lib/participationNotificationService";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// This route should be called by a scheduled job (e.g., CRON) to send reminders
export async function POST(req: NextRequest) {
  try {
    // Ensure the request is authenticated or from an authorized source
    const session = await getServerSession(authOptions);
    const isAdmin = session?.user && (session.user as any).role === "ADMIN";
    
    if (!isAdmin) {
      // Check for API key for cron job calls
      const apiKey = req.headers.get("x-api-key");
      const validApiKey = process.env.REMINDERS_API_KEY;
      
      if (!apiKey || apiKey !== validApiKey) {
        return NextResponse.json(
          { error: "Unauthorized" },
          { status: 401 }
        );
      }
    }

    const body = await req.json();
    const { hours } = body;

    if (!hours || (hours !== 48 && hours !== 24)) {
      return NextResponse.json(
        { error: "Hours parameter must be 48 or 24" },
        { status: 400 }
      );
    }

    // Send the notifications
    const count = await sendParticipationQueryNotifications(hours);

    return NextResponse.json({
      success: true,
      message: `Sent ${count} attendance query notifications for events in ${hours} hours`,
    });
  } catch (error) {
    console.error("Error sending reminders:", error);
    return NextResponse.json(
      { error: "Failed to send reminders" },
      { status: 500 }
    );
  }
} 