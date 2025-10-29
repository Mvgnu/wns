// feature: organizer-console
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';
import { getOrganizerConsoleData } from '@/lib/groups/organizer-console';
import {
  createSponsorAction,
  createTierAction,
  deleteTierAction,
  updateSponsorStatusAction,
  updateTierAction
} from './actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

type PageProps = {
  params: {
    slug: string;
  };
};

function formatCurrency(amountInCents: number, currency: string) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amountInCents / 100);
}

export default async function OrganizerConsolePage({ params }: PageProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect(`/login?callbackUrl=/groups/manage/${params.slug}`);
  }

  let consoleData;

  try {
    consoleData = await getOrganizerConsoleData(params.slug, session.user.id);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'GROUP_NOT_FOUND') {
        notFound();
      }

      if (error.message === 'UNAUTHORIZED') {
        redirect(`/groups/${params.slug}`);
      }
    }

    throw error;
  }

  const primaryCurrency = consoleData.tiers[0]?.currency ?? 'EUR';

  const createTier = createTierAction.bind(null, params.slug);
  const updateTier = updateTierAction.bind(null, params.slug);
  const deleteTier = deleteTierAction.bind(null, params.slug);
  const createSponsor = createSponsorAction.bind(null, params.slug);
  const updateSponsorStatus = updateSponsorStatusAction.bind(null, params.slug);

  return (
    <div className="space-y-10">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Organizer Console</h1>
          <p className="text-muted-foreground">
            Unlock monetization levers, sponsorship opportunities, and operational insights for {consoleData.group.name}.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href={`/groups/${params.slug}`}>View public group page</Link>
        </Button>
      </header>

      <section>
        <h2 className="text-xl font-semibold">Membership Pulse</h2>
        <p className="text-muted-foreground text-sm">
          Track enrollment momentum and recurring revenue expectations at a glance.
        </p>
        <div className="mt-4 grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader>
              <CardDescription>Total members</CardDescription>
              <CardTitle>{consoleData.membership.total}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardDescription>Active memberships</CardDescription>
              <CardTitle>{consoleData.membership.active}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardDescription>Paying members</CardDescription>
              <CardTitle>{consoleData.membership.paying}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardDescription>Projected MRR</CardDescription>
              <CardTitle>{formatCurrency(consoleData.membership.monthlyRecurringRevenue, primaryCurrency)}</CardTitle>
            </CardHeader>
          </Card>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="text-xl font-semibold">Membership tiers</h2>
            <p className="text-sm text-muted-foreground">
              Package value for superfans with transparent benefits and automated renewals.
            </p>
          </div>
        </div>
        <div className="overflow-hidden rounded-xl border">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 font-medium">Tier</th>
                <th className="px-4 py-3 font-medium">Price</th>
                <th className="px-4 py-3 font-medium">Billing</th>
                <th className="px-4 py-3 font-medium">Members</th>
                <th className="px-4 py-3 font-medium">Benefits</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {consoleData.tiers.length === 0 ? (
                <tr>
                  <td className="px-4 py-4 text-muted-foreground" colSpan={6}>
                    No membership tiers yet. Launch your first tier using the form below.
                  </td>
                </tr>
              ) : (
                consoleData.tiers.map((tier) => (
                  <tr key={tier.id} className="border-t">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{tier.name}</span>
                        {tier.isDefault && <Badge variant="secondary">Default</Badge>}
                      </div>
                      {tier.description && (
                        <p className="text-xs text-muted-foreground">{tier.description}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {formatCurrency(tier.priceCents, tier.currency)}
                    </td>
                    <td className="px-4 py-3 capitalize">{tier.billingPeriod}</td>
                    <td className="px-4 py-3">{tier.memberCount}</td>
                    <td className="px-4 py-3">
                      <ul className="list-disc space-y-1 pl-4 text-xs">
                        {tier.benefits.map((benefit) => (
                          <li key={benefit}>{benefit}</li>
                        ))}
                      </ul>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        {!tier.isDefault && (
                          <form action={updateTier}>
                            <input type="hidden" name="tierId" value={tier.id} />
                            <input type="hidden" name="isDefault" value="true" />
                            <Button variant="ghost" size="sm" type="submit">
                              Make default
                            </Button>
                          </form>
                        )}
                        {!tier.isDefault && tier.memberCount === 0 && (
                          <form action={deleteTier}>
                            <input type="hidden" name="tierId" value={tier.id} />
                            <Button variant="ghost" size="sm" className="text-destructive" type="submit">
                              Delete
                            </Button>
                          </form>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Create a new tier</CardTitle>
            <CardDescription>Design premium access levels tailored to your community.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={createTier} className="grid gap-4 md:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" name="name" placeholder="Legends Circle" required />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="price">Price (in {primaryCurrency})</Label>
                <Input id="price" name="price" placeholder="49" type="number" min="0" step="1" />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="currency">Currency</Label>
                <Input id="currency" name="currency" defaultValue={primaryCurrency} maxLength={3} />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="billingPeriod">Billing cadence</Label>
                <select
                  id="billingPeriod"
                  name="billingPeriod"
                  className="rounded-md border bg-background px-3 py-2 text-sm"
                  defaultValue="month"
                >
                  <option value="month">Monthly</option>
                  <option value="year">Yearly</option>
                  <option value="once">One-time</option>
                </select>
              </div>
              <div className="md:col-span-2 flex flex-col gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" name="description" placeholder="Premium coaching, priority booking, ..." />
              </div>
              <div className="md:col-span-2 flex flex-col gap-2">
                <Label htmlFor="benefits">Benefits (one per line)</Label>
                <Textarea id="benefits" name="benefits" placeholder={'Early access to sessions\nMonthly strategy call'} />
              </div>
              <div className="flex items-center gap-2">
                <input id="isDefault" name="isDefault" type="checkbox" className="h-4 w-4" />
                <Label htmlFor="isDefault" className="text-sm font-normal">
                  Set as default tier
                </Label>
              </div>
              <div className="md:col-span-2 flex justify-end">
                <Button type="submit">Launch tier</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </section>

      <Separator />

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="text-xl font-semibold">Sponsorship runway</h2>
            <p className="text-sm text-muted-foreground">
              Curate brand collaborations with full lifecycle control.
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {consoleData.sponsors.length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>No sponsor slots yet</CardTitle>
                <CardDescription>Activate a slot to start monetizing your surface area.</CardDescription>
              </CardHeader>
            </Card>
          ) : (
            consoleData.sponsors.map((slot) => (
              <Card key={slot.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>{slot.name}</CardTitle>
                    <Badge variant="outline" className="uppercase">
                      {slot.status}
                    </Badge>
                  </div>
                  <CardDescription>
                    {slot.startDate ? slot.startDate.toLocaleDateString() : 'Flexible start'} →{' '}
                    {slot.endDate ? slot.endDate.toLocaleDateString() : 'Open-ended'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-sm text-muted-foreground">
                    Impression goal: {slot.impressionGoal ?? 'Not set'}
                  </div>
                  <div className="flex gap-2">
                    <form action={updateSponsorStatus} className="flex-1">
                      <input type="hidden" name="slotId" value={slot.id} />
                      <select
                        name="status"
                        defaultValue={slot.status}
                        className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                      >
                        <option value="draft">Draft</option>
                        <option value="scheduled">Scheduled</option>
                        <option value="live">Live</option>
                        <option value="paused">Paused</option>
                        <option value="completed">Completed</option>
                      </select>
                      <Button type="submit" variant="secondary" size="sm" className="mt-2 w-full">
                        Update status
                      </Button>
                    </form>
                    <form action={updateSponsorStatus}>
                      <input type="hidden" name="slotId" value={slot.id} />
                      <input type="hidden" name="status" value="completed" />
                      <Button variant="ghost" size="sm" className="text-destructive" type="submit">
                        Archive
                      </Button>
                    </form>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Create sponsor slot</CardTitle>
            <CardDescription>Give partners premium placement with clear deliverables.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={createSponsor} className="grid gap-4 md:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="sponsor-name">Name</Label>
                <Input id="sponsor-name" name="name" placeholder="Local gear shop" required />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  name="status"
                  className="rounded-md border bg-background px-3 py-2 text-sm"
                  defaultValue="draft"
                >
                  <option value="draft">Draft</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="live">Live</option>
                  <option value="paused">Paused</option>
                </select>
              </div>
              <div className="md:col-span-2 flex flex-col gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" name="description" placeholder="Outline sponsor assets and commitments." />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="assetUrl">Creative asset URL</Label>
                <Input id="assetUrl" name="assetUrl" placeholder="https://cdn.example.com/banner.png" />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="targetUrl">Destination URL</Label>
                <Input id="targetUrl" name="targetUrl" placeholder="https://partner.example.com" />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="impressionGoal">Impression goal</Label>
                <Input id="impressionGoal" name="impressionGoal" placeholder="5000" type="number" min="0" step="100" />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="startDate">Start date</Label>
                <Input id="startDate" name="startDate" type="date" />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="endDate">End date</Label>
                <Input id="endDate" name="endDate" type="date" />
              </div>
              <div className="md:col-span-2 flex justify-end">
                <Button type="submit">Create slot</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </section>

      <Separator />

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Upcoming events</h2>
        <p className="text-sm text-muted-foreground">
          Align programming with monetization funnels and keep attendance high.
        </p>
        {consoleData.upcomingEvents.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>No future events scheduled</CardTitle>
              <CardDescription>Plan your next activation to fuel tier adoption.</CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {consoleData.upcomingEvents.map((event) => (
              <Card key={event.id}>
                <CardHeader>
                  <CardTitle>{event.title}</CardTitle>
                  <CardDescription>
                    {event.startTime.toLocaleString()} ·{' '}
                    {event.isSoldOut
                      ? 'Sold out'
                      : event.maxAttendees
                        ? `${event.maxAttendees} seats`
                        : 'Unlimited capacity'}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
