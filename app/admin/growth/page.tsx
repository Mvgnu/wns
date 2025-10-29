import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

// feature: onboarding-growth
// intent: summarise onboarding and referral growth metrics for operators.

export const revalidate = 120;

export default async function GrowthDashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id || !session.user.isAdmin) {
    redirect("/");
  }

  const [totalCodes, activeCodes, totalReferrals, acceptedReferrals, completedReferrals, onboardingCompleted, onboardingPending] =
    await Promise.all([
      prisma.referralCode.count(),
      prisma.referralCode.count({ where: { active: true } }),
      prisma.referral.count(),
      prisma.referral.count({ where: { status: "accepted" } }),
      prisma.referral.count({ where: { status: "completed" } }),
      prisma.user.count({ where: { onboardingStatus: "completed" } }),
      prisma.user.count({ where: { onboardingStatus: { not: "completed" } } }),
    ]);

  const topReferrersRaw = await prisma.referral.groupBy({
    by: ["inviterId"],
    _count: { _all: true },
    orderBy: { _count: { _all: "desc" } },
    take: 5,
  });

  const inviterIds = topReferrersRaw.map((row) => row.inviterId);
  const inviterProfiles = inviterIds.length
    ? await prisma.user.findMany({
        where: { id: { in: inviterIds } },
        select: { id: true, name: true, email: true },
      })
    : [];

  const inviterReferralDetails = inviterIds.length
    ? await prisma.referral.findMany({
        where: { inviterId: { in: inviterIds } },
        select: { inviterId: true, status: true },
      })
    : [];

  const scoreboard = topReferrersRaw.map((row) => {
    const referralsForInviter = inviterReferralDetails.filter((item) => item.inviterId === row.inviterId);
    const profile = inviterProfiles.find((item) => item.id === row.inviterId);

    return {
      inviterId: row.inviterId,
      name: profile?.name ?? "Unbekannt",
      email: profile?.email ?? "—",
      total: row._count._all,
      accepted: referralsForInviter.filter((item) => item.status === "accepted").length,
      completed: referralsForInviter.filter((item) => item.status === "completed").length,
    };
  });

  const totalMembers = onboardingCompleted + onboardingPending;
  const completionRate = totalMembers > 0 ? Math.round((onboardingCompleted / totalMembers) * 100) : 0;

  return (
    <main className="mx-auto max-w-5xl space-y-10 px-6 py-12">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold text-slate-900">Growth & Referral Dashboard</h1>
        <p className="text-sm text-slate-600">
          Überblicke Onboarding-Fortschritt und Referral-Aktivitäten, um gezielt Growth-Initiativen zu steuern.
        </p>
      </header>

      <section className="grid gap-6 md:grid-cols-3">
        <MetricCard label="Aktive Empfehlungscodes" value={activeCodes} sublabel={`${totalCodes} insgesamt`} />
        <MetricCard
          label="Onboarding abgeschlossen"
          value={`${completionRate}%`}
          sublabel={`${onboardingCompleted} von ${totalMembers} Mitgliedern`}
        />
        <MetricCard
          label="Referral-Konversion"
          value={totalReferrals > 0 ? `${Math.round((completedReferrals / totalReferrals) * 100)}%` : '0%'}
          sublabel={`${completedReferrals} von ${totalReferrals} Einladungen`} />
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-slate-900">Top-Empfehler:innen</h2>
        <p className="text-sm text-slate-600">Wer bringt die meisten neuen Mitglieder? Nutze diese Insights für gezielte Incentives.</p>

        <div className="overflow-hidden rounded-lg border border-slate-200">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Mitglied</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Gesendet</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Akzeptiert</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Konvertiert</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {scoreboard.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-sm text-slate-500">
                    Noch keine Referral-Aktivität vorhanden.
                  </td>
                </tr>
              )}
              {scoreboard.map((row) => (
                <tr key={row.inviterId}>
                  <td className="px-4 py-3 text-sm text-slate-700">
                    <div className="font-medium text-slate-900">{row.name}</div>
                    <div className="text-xs text-slate-500">{row.email}</div>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-700">{row.total}</td>
                  <td className="px-4 py-3 text-sm text-slate-700">{row.accepted}</td>
                  <td className="px-4 py-3 text-sm text-slate-700">{row.completed}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-slate-900">Referral-Pipeline</h2>
        <p className="text-sm text-slate-600">
          Akzeptierte Einladungen: {acceptedReferrals} · Erfolgreich konvertiert: {completedReferrals}
        </p>
      </section>
    </main>
  );
}

type MetricCardProps = {
  label: string;
  value: string | number;
  sublabel?: string;
};

function MetricCard({ label, value, sublabel }: MetricCardProps) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-slate-900">{value}</p>
      {sublabel && <p className="mt-1 text-xs text-slate-500">{sublabel}</p>}
    </div>
  );
}
