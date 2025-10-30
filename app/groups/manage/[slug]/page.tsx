// feature: organizer-console
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { getServerSession } from 'next-auth';

import type { PaymentDisputeActionType } from '@prisma/client';

import { authOptions } from '@/lib/auth';
import { getOrganizerConsoleData } from '@/lib/groups/organizer-console';
import {
  createCouponAction,
  createSponsorAction,
  createTierAction,
  deleteTierAction,
  deactivateCouponAction,
  recordDisputeActionAction,
  requestManualPayoutAction,
  updateSponsorStatusAction,
  updateTierAction,
  updatePayoutScheduleAction,
  togglePayoutHoldAction
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
  const createCoupon = createCouponAction.bind(null, params.slug);
  const deactivateCoupon = deactivateCouponAction.bind(null, params.slug);
  const createSponsor = createSponsorAction.bind(null, params.slug);
  const updateSponsorStatus = updateSponsorStatusAction.bind(null, params.slug);
  const updatePayoutSchedule = updatePayoutScheduleAction.bind(null, params.slug);
  const togglePayoutHold = togglePayoutHoldAction.bind(null, params.slug);
  const requestManualPayout = requestManualPayoutAction.bind(null, params.slug);
  const recordDisputeAction = recordDisputeActionAction.bind(null, params.slug);

  const disputeActionOptions = [
    {
      value: 'note',
      label: 'Add internal note',
      requiresNote: true
    },
    {
      value: 'evidence_submitted',
      label: 'Confirm evidence submitted to Stripe',
      requiresNote: false
    },
    {
      value: 'escalated',
      label: 'Escalate to platform ops',
      requiresNote: true
    },
    {
      value: 'written_off',
      label: 'Write off loss',
      requiresNote: true
    }
  ] satisfies Array<{
    value: PaymentDisputeActionType;
    label: string;
    requiresNote: boolean;
  }>;

  const noteRequirementCopy = disputeActionOptions
    .filter((option) => option.requiresNote)
    .map((option) => option.label.toLowerCase())
    .join(', ');

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

      <section className="space-y-6">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xl font-semibold">Revenue & payouts</h2>
            <p className="text-sm text-muted-foreground">
              Monitor earnings, track coupons, and control payouts from a single command center.
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {consoleData.revenue.summary.length === 0 ? (
            <Card className="md:col-span-2 xl:col-span-4">
              <CardHeader>
                <CardTitle>No revenue captured yet</CardTitle>
                <CardDescription>
                  Launch paid tiers or events to start generating earnings insights in real time.
                </CardDescription>
              </CardHeader>
            </Card>
          ) : (
            consoleData.revenue.summary.map((summary) => (
              <Card key={summary.currency}>
                <CardHeader>
                  <CardDescription className="uppercase tracking-wide text-xs">
                    {summary.currency} net earnings
                  </CardDescription>
                  <CardTitle>{formatCurrency(summary.netCents, summary.currency)}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Gross</span>
                    <span>{formatCurrency(summary.grossCents, summary.currency)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Fees</span>
                    <span>-{formatCurrency(summary.feeCents, summary.currency)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Transactions</span>
                    <span>{summary.transactionCount}</span>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Payout schedule</CardTitle>
              <CardDescription>
                Configure automated transfers and destination account preferences.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-muted-foreground">
                Current status:{' '}
                <span className="font-medium text-foreground">
                  {consoleData.payoutSchedule?.status === 'paused' || consoleData.payoutSchedule?.manualHold
                    ? 'Paused'
                    : 'Active'}
                </span>
                {consoleData.payoutSchedule?.nextPayoutScheduledAt && (
                  <span className="block">
                    Next transfer:{' '}
                    {consoleData.payoutSchedule.nextPayoutScheduledAt.toLocaleString()}
                  </span>
                )}
              </div>
              <form action={updatePayoutSchedule} className="space-y-3">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="frequency">Frequency</Label>
                  <select
                    id="frequency"
                    name="frequency"
                    defaultValue={consoleData.payoutSchedule?.frequency ?? 'weekly'}
                    className="rounded-md border bg-background px-3 py-2 text-sm"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="manual">Manual</option>
                  </select>
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="destinationAccount">Destination account</Label>
                  <Input
                    id="destinationAccount"
                    name="destinationAccount"
                    placeholder="acct_1234"
                    defaultValue={consoleData.payoutSchedule?.destinationAccount ?? ''}
                  />
                </div>
                <Button type="submit" className="w-full">
                  Save payout preferences
                </Button>
              </form>
              <form action={togglePayoutHold} className="flex flex-col gap-3">
                <input
                  type="hidden"
                  name="hold"
                  value={consoleData.payoutSchedule?.manualHold ? 'false' : 'true'}
                />
                <Button variant="outline" type="submit" className="w-full">
                  {consoleData.payoutSchedule?.manualHold ? 'Resume automatic payouts' : 'Pause automatic payouts'}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Manual payout request</CardTitle>
              <CardDescription>
                Trigger an ad-hoc transfer for reconciliation or special cases.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form action={requestManualPayout} className="space-y-3">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="amount">Amount ({primaryCurrency})</Label>
                  <Input id="amount" name="amount" placeholder="250" type="number" min="1" step="1" />
                </div>
                <input type="hidden" name="currency" value={primaryCurrency} />
                <div className="flex flex-col gap-2">
                  <Label htmlFor="note">Note</Label>
                  <Textarea id="note" name="note" placeholder="Context for finance ops" />
                </div>
                <Button type="submit" className="w-full">
                  Submit payout request
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="order-2 lg:order-1">
            <CardHeader>
              <CardTitle>Recent transactions</CardTitle>
              <CardDescription>
                Snapshot of the latest membership charges, refunds, and adjustments.
              </CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              {consoleData.revenue.recentEntries.length === 0 ? (
                <p className="text-sm text-muted-foreground">No transactions recorded yet.</p>
              ) : (
                <table className="w-full min-w-[480px] text-left text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-4 py-2">When</th>
                      <th className="px-4 py-2">Type</th>
                      <th className="px-4 py-2">Gross</th>
                      <th className="px-4 py-2">Net</th>
                      <th className="px-4 py-2">Fees</th>
                    </tr>
                  </thead>
                  <tbody>
                    {consoleData.revenue.recentEntries.map((entry) => (
                      <tr key={entry.id} className="border-t">
                        <td className="px-4 py-2 whitespace-nowrap">
                          {entry.occurredAt.toLocaleString()}
                        </td>
                        <td className="px-4 py-2 capitalize">{entry.type.replace('membership_', '').replace('_', ' ')}</td>
                        <td className="px-4 py-2">{formatCurrency(entry.amountGrossCents, entry.currency)}</td>
                        <td className="px-4 py-2">{formatCurrency(entry.amountNetCents, entry.currency)}</td>
                        <td className="px-4 py-2">{formatCurrency(entry.feeCents, entry.currency)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>

          <Card className="order-1 lg:order-2">
            <CardHeader>
              <CardTitle>Coupon catalog</CardTitle>
              <CardDescription>
                Track redemptions and launch limited-time incentives.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                {consoleData.coupons.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No coupons yet. Create your first offer below.</p>
                ) : (
                  <div className="max-h-56 space-y-2 overflow-y-auto pr-1">
                    {consoleData.coupons.map((coupon) => (
                      <div
                        key={coupon.id}
                        className="flex items-start justify-between gap-4 rounded-lg border px-3 py-2 text-sm"
                      >
                        <div>
                          <div className="font-medium">{coupon.code}</div>
                          <div className="text-xs text-muted-foreground">
                            {coupon.discountType === 'percentage'
                              ? `${coupon.percentageOff}% off`
                              : `${formatCurrency(coupon.amountOffCents ?? 0, coupon.currency ?? primaryCurrency)} off`}
                            {coupon.maxRedemptions ? ` · ${coupon.redemptionCount}/${coupon.maxRedemptions} used` : ''}
                          </div>
                          {!coupon.isActive && <div className="text-xs text-destructive">Inactive</div>}
                        </div>
                        {coupon.isActive && (
                          <form action={deactivateCoupon}>
                            <input type="hidden" name="couponId" value={coupon.id} />
                            <Button variant="ghost" size="sm" className="text-destructive" type="submit">
                              Disable
                            </Button>
                          </form>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <Separator />
              <form action={createCoupon} className="grid gap-3">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="coupon-code">Code</Label>
                  <Input id="coupon-code" name="code" placeholder="WELCOME50" required />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="discountType">Discount type</Label>
                  <select
                    id="discountType"
                    name="discountType"
                    className="rounded-md border bg-background px-3 py-2 text-sm"
                    defaultValue="percentage"
                  >
                    <option value="percentage">Percentage</option>
                    <option value="fixed_amount">Fixed amount</option>
                  </select>
                </div>
                <div className="grid gap-2 md:grid-cols-2">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="percentageOff">% off</Label>
                    <Input id="percentageOff" name="percentageOff" placeholder="25" type="number" min="1" max="100" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="amountOffCents">Amount off ({primaryCurrency})</Label>
                    <Input id="amountOffCents" name="amountOffCents" placeholder="10" type="number" min="1" />
                  </div>
                </div>
                <div className="grid gap-2 md:grid-cols-2">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="maxRedemptions">Max redemptions</Label>
                    <Input id="maxRedemptions" name="maxRedemptions" placeholder="50" type="number" min="1" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="currency">Currency</Label>
                    <Input id="currency" name="currency" defaultValue={primaryCurrency} maxLength={3} />
                  </div>
                </div>
                <div className="grid gap-2 md:grid-cols-2">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="startsAt">Starts at</Label>
                    <Input id="startsAt" name="startsAt" type="date" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="endsAt">Ends at</Label>
                    <Input id="endsAt" name="endsAt" type="date" />
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" name="description" placeholder="Launch promotion details" />
                </div>
              <Button type="submit">Create coupon</Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Disputes &amp; chargebacks</CardTitle>
          <CardDescription>
            Stay ahead of evidence deadlines and log organizer responses for finance traceability.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {consoleData.disputes.length === 0 ? (
            <p className="text-sm text-muted-foreground">No active disputes right now. Stripe will notify you here when new cases open.</p>
          ) : (
            <div className="space-y-4">
              {consoleData.disputes.map((dispute) => (
                <div key={dispute.id} className="space-y-3 rounded-lg border p-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-1 text-sm">
                      <div className="font-medium text-foreground">
                        {formatCurrency(dispute.amountCents, dispute.currency)} · {dispute.status.replace(/_/g, ' ')}
                      </div>
                      {dispute.reason && (
                        <div className="text-xs text-muted-foreground">
                          Reason: {dispute.reason.replace(/_/g, ' ')}
                        </div>
                      )}
                      <div className="text-xs text-muted-foreground">
                        Opened {dispute.createdAt.toLocaleString()}
                      </div>
                      {dispute.evidenceDueAt && (
                        <div className="text-xs text-muted-foreground">
                          Evidence due {dispute.evidenceDueAt.toLocaleString()}
                        </div>
                      )}
                      {dispute.latestAction && (
                        <div className="text-xs text-muted-foreground">
                          Last action: {dispute.latestAction.actionType.replace(/_/g, ' ')}
                          {dispute.latestAction.actorName && ` by ${dispute.latestAction.actorName}`}
                          {' · '}
                          {dispute.latestAction.createdAt.toLocaleString()}
                          {dispute.latestAction.note && (
                            <span className="block text-muted-foreground/80">
                              Note: {dispute.latestAction.note}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <Badge
                      variant={
                        dispute.status === 'needs_response' || dispute.status === 'warning_needs_response'
                          ? 'destructive'
                          : 'secondary'
                      }
                    >
                      {dispute.status.replace(/_/g, ' ')}
                    </Badge>
                  </div>
                  <form action={recordDisputeAction} className="space-y-3">
                    <input type="hidden" name="disputeId" value={dispute.id} />
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="flex flex-col gap-2">
                        <Label htmlFor={`dispute-action-${dispute.id}`}>Action</Label>
                        <select
                          id={`dispute-action-${dispute.id}`}
                          name="actionType"
                          className="rounded-md border bg-background px-3 py-2 text-sm"
                          defaultValue="note"
                        >
                          {disputeActionOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                        <p className="text-xs text-muted-foreground">
                          Notes are required for {noteRequirementCopy}; detailed context keeps finance ops in the loop.
                        </p>
                      </div>
                      <div className="flex flex-col gap-2">
                        <Label htmlFor={`dispute-note-${dispute.id}`}>
                          Notes
                          <span className="text-muted-foreground"> (required for most actions)</span>
                        </Label>
                        <Textarea
                          id={`dispute-note-${dispute.id}`}
                          name="note"
                          placeholder="Summarize outreach, escalation context, or evidence links"
                        />
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-xs text-muted-foreground">
                        Evidence submissions can be tracked here alongside internal notes.
                      </p>
                      <Button type="submit" size="sm">
                        Log response
                      </Button>
                    </div>
                  </form>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
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
                <th className="px-4 py-3 font-medium">Capacity</th>
                <th className="px-4 py-3 font-medium">Benefits</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {consoleData.tiers.length === 0 ? (
                <tr>
                  <td className="px-4 py-4 text-muted-foreground" colSpan={7}>
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
                      {tier.memberLimit === null ? (
                        <span className="text-xs text-muted-foreground">Unlimited</span>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span>
                            {tier.memberCount}/{tier.memberLimit}
                          </span>
                          {tier.atCapacity ? (
                            <Badge variant="destructive" className="uppercase">Full</Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">{tier.availableSlots} open</span>
                          )}
                        </div>
                      )}
                    </td>
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
                <Label htmlFor="memberLimit">
                  Member limit
                  <span className="text-muted-foreground"> (optional)</span>
                </Label>
                <Input
                  id="memberLimit"
                  name="memberLimit"
                  placeholder="50"
                  type="number"
                  min="0"
                  step="1"
                />
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
