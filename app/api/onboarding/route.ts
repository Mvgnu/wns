import { NextResponse } from "next/server";
import { getSafeServerSession } from "@/lib/sessionHelper";
import { getOnboardingState } from "@/lib/onboarding/service";

// feature: onboarding-growth
// intent: expose aggregate onboarding state for authenticated members.

export async function GET() {
  try {
    const session = await getSafeServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const state = await getOnboardingState(session.user.id);
    return NextResponse.json(state);
  } catch (error) {
    console.error("Failed to load onboarding state", error);
    return NextResponse.json({ error: "Failed to load onboarding state" }, { status: 500 });
  }
}
