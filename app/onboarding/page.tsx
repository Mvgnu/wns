import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getOnboardingState } from "@/lib/onboarding/service";
import OnboardingWizard from "@/components/onboarding/OnboardingWizard";

// feature: onboarding-growth
// intent: enforce onboarding for authenticated members before exposing the broader app.

export default async function OnboardingPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/auth/signin?callbackUrl=/onboarding");
  }

  const state = await getOnboardingState(session.user.id);

  if (state.status === "completed") {
    redirect("/");
  }

  return (
    <div className="bg-slate-50 py-16">
      <OnboardingWizard initialState={state} />
    </div>
  );
}
