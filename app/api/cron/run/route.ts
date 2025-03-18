import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { runJobManually } from "@/lib/cronService";

export async function POST(req: NextRequest) {
  try {
    // Ensure the request is authenticated or from an authorized source
    const session = await getServerSession(authOptions);
    const isAdmin = session?.user && (session.user as any).role === "ADMIN";
    
    if (!isAdmin) {
      // Check for API key
      const apiKey = req.headers.get("x-api-key");
      const validApiKey = process.env.CRON_API_KEY;
      
      if (!apiKey || apiKey !== validApiKey) {
        return NextResponse.json(
          { error: "Unauthorized" },
          { status: 401 }
        );
      }
    }

    const body = await req.json();
    const { jobType } = body;

    if (!jobType || (jobType !== '48_HOUR_REMINDER' && jobType !== '24_HOUR_REMINDER')) {
      return NextResponse.json(
        { error: "jobType must be '48_HOUR_REMINDER' or '24_HOUR_REMINDER'" },
        { status: 400 }
      );
    }

    // Run the job
    const count = await runJobManually(jobType);

    return NextResponse.json({
      success: true,
      message: `Manually ran ${jobType} job and sent ${count} notifications`,
    });
  } catch (error) {
    console.error("Error running cron job:", error);
    return NextResponse.json(
      { error: "Failed to run cron job" },
      { status: 500 }
    );
  }
} 