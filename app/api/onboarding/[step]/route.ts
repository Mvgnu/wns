import { NextRequest, NextResponse } from "next/server";
import { getSafeServerSession } from "@/lib/sessionHelper";
import {
  completeOnboarding,
  getOnboardingState,
  saveAvailability,
  saveInterests,
  saveLocationPreferences,
} from "@/lib/onboarding/service";

// feature: onboarding-growth
// intent: persist step-specific onboarding inputs and return the refreshed state.

export async function POST(req: NextRequest, { params }: { params: { step: string } }) {
  try {
    const session = await getSafeServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const step = params.step;
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }

    switch (step) {
      case "interests": {
        const interests = Array.isArray(body?.interests) ? body.interests : [];
        await saveInterests(session.user.id, interests);
        break;
      }
      case "location": {
        await saveLocationPreferences(session.user.id, body?.location ?? {});
        break;
      }
      case "availability": {
        const slots = Array.isArray(body?.availability) ? body.availability : [];
        await saveAvailability(session.user.id, slots);
        break;
      }
      case "complete": {
        await completeOnboarding(session.user.id);
        break;
      }
      default:
        return NextResponse.json({ error: "Unknown onboarding step" }, { status: 400 });
    }

    const state = await getOnboardingState(session.user.id);
    return NextResponse.json(state);
  } catch (error) {
    console.error("Failed to persist onboarding step", error);
    return NextResponse.json({ error: "Failed to persist onboarding step" }, { status: 500 });
  }
}
