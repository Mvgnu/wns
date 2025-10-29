import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { subDays } from 'date-fns';
import type { ReactNode } from 'react';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

// feature: analytics-dashboard
// intent: provide privacy-conscious performance insights for operators.

export const revalidate = 300;

export default async function AnalyticsDashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id || !session.user.isAdmin) {
    redirect('/');
  }

  const lookbackEnd = new Date();
  const lookbackStart = subDays(lookbackEnd, 7);

  const [recentPlatformMetrics, topGroupsRaw] = await Promise.all([
    prisma.dailyPlatformMetric.findMany({
      orderBy: { snapshotDate: 'desc' },
      take: 30
    }),
    prisma.groupDailyMetric.groupBy({
      by: ['groupId'],
      where: { snapshotDate: { gte: lookbackStart } },
      _sum: { attendance: true, eventsHosted: true, activeMembers: true },
      orderBy: { _sum: { attendance: 'desc' } },
      take: 6
    })
  ]);

  const chronologicalMetrics = [...recentPlatformMetrics].reverse();
  const latestMetric = recentPlatformMetrics[0] ?? null;

  const groupIds = topGroupsRaw.map((row) => row.groupId).filter(Boolean);
  const groups = groupIds.length
    ? await prisma.group.findMany({
        where: { id: { in: groupIds } },
        select: { id: true, name: true, slug: true }
      })
    : [];

  const groupSummaries = topGroupsRaw.map((row) => {
    const profile = groups.find((entry) => entry.id === row.groupId);
    return {
      groupId: row.groupId,
      name: profile?.name ?? 'Unbekannte Gruppe',
      slug: profile?.slug ?? undefined,
      attendance: row._sum.attendance ?? 0,
      eventsHosted: row._sum.eventsHosted ?? 0,
      activeMembers: row._sum.activeMembers ?? 0
    };
  });

  return (
    <main className="mx-auto max-w-6xl space-y-10 px-6 py-12">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold text-slate-900">Analytics Dashboard</h1>
        <p className="text-sm text-slate-600">
          Überblick über tägliche Aktivitäten, um Wachstum und Engagement im Blick zu behalten.
        </p>
      </header>

      <section className="grid gap-6 md:grid-cols-4">
        <MetricCard label="Aktive Mitglieder" value={latestMetric?.activeMembers ?? 0} sublabel="letzter Tag" />
        <MetricCard label="Neue Mitglieder" value={latestMetric?.newMembers ?? 0} sublabel="letzter Tag" />
        <MetricCard label="Erstellte Events" value={latestMetric?.eventsCreated ?? 0} sublabel="letzter Tag" />
        <MetricCard label="Check-ins" value={latestMetric?.checkIns ?? 0} sublabel="letzter Tag" />
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-slate-900">30 Tage Verlauf</h2>
        <p className="text-sm text-slate-600">
          Kerndaten im Zeitverlauf. Nutze sie, um Anomalien oder Trends zügig zu erkennen.
        </p>

        <div className="overflow-hidden rounded-lg border border-slate-200">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <HeaderCell>Tagesdatum</HeaderCell>
                <HeaderCell>Aktive Mitglieder</HeaderCell>
                <HeaderCell>Neue Mitglieder</HeaderCell>
                <HeaderCell>RSVPs</HeaderCell>
                <HeaderCell>Check-ins</HeaderCell>
                <HeaderCell>Feedback</HeaderCell>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {chronologicalMetrics.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-sm text-slate-500">
                    Noch keine aggregierten Daten vorhanden.
                  </td>
                </tr>
              )}
              {chronologicalMetrics.map((item) => (
                <tr key={item.id}>
                  <BodyCell>{new Date(item.snapshotDate).toLocaleDateString('de-DE')}</BodyCell>
                  <BodyCell>{item.activeMembers}</BodyCell>
                  <BodyCell>{item.newMembers}</BodyCell>
                  <BodyCell>{item.rsvpTotal}</BodyCell>
                  <BodyCell>{item.checkIns}</BodyCell>
                  <BodyCell>{item.feedbackCount}</BodyCell>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-slate-900">Engagierteste Gruppen (7 Tage)</h2>
        <p className="text-sm text-slate-600">
          Kombination aus Teilnahme und aktiven Mitgliedern hilft bei der Priorisierung von Ressourcen.
        </p>

        <div className="overflow-hidden rounded-lg border border-slate-200">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <HeaderCell>Gruppe</HeaderCell>
                <HeaderCell>Teilnahmen</HeaderCell>
                <HeaderCell>Events</HeaderCell>
                <HeaderCell>Aktive Mitglieder</HeaderCell>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {groupSummaries.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-sm text-slate-500">
                    Noch keine Gruppenaktivität vorhanden.
                  </td>
                </tr>
              )}
              {groupSummaries.map((row) => (
                <tr key={row.groupId}>
                  <BodyCell>
                    <div className="font-medium text-slate-900">{row.name}</div>
                    {row.slug && <div className="text-xs text-slate-500">/{row.slug}</div>}
                  </BodyCell>
                  <BodyCell>{row.attendance}</BodyCell>
                  <BodyCell>{row.eventsHosted}</BodyCell>
                  <BodyCell>{row.activeMembers}</BodyCell>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

type MetricCardProps = {
  label: string;
  value: number;
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

type CellProps = {
  children: ReactNode;
};

function HeaderCell({ children }: CellProps) {
  return <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">{children}</th>;
}

function BodyCell({ children }: CellProps) {
  return <td className="px-4 py-3 text-sm text-slate-700">{children}</td>;
}
