import {
  formatBenefitsInput,
  summarizeMembershipStatus,
  toPriceCents,
  totalRecurringValue
} from '@/lib/groups/organizer-console';

describe('organizer console helpers', () => {
  it('normalizes benefit text to trimmed entries', () => {
    const input = 'Priority court access\n\n  Monthly clinic  \n';
    expect(formatBenefitsInput(input)).toEqual(['Priority court access', 'Monthly clinic']);
  });

  it('converts price strings to cents with rounding and guards invalid data', () => {
    expect(toPriceCents('12.49')).toBe(1249);
    expect(toPriceCents('')).toBe(0);
    expect(toPriceCents('-4')).toBe(0);
  });

  it('summarizes membership statuses', () => {
    const summary = summarizeMembershipStatus([
      { status: 'active' },
      { status: 'active' },
      { status: 'canceled' },
    ] as any);

    expect(summary.active).toBe(2);
    expect(summary.canceled).toBe(1);
    expect(summary.past_due ?? 0).toBe(0);
  });

  it('computes recurring revenue for monthly and yearly tiers', () => {
    const tiers = [
      { id: 'a', billingPeriod: 'month', priceCents: 2500 },
      { id: 'b', billingPeriod: 'year', priceCents: 12000 },
    ] as any;

    const memberships = [
      { tierId: 'a' },
      { tierId: 'a' },
      { tierId: 'b' },
    ] as any;

    expect(totalRecurringValue(tiers, memberships)).toBe(2500 * 2 + 1000);
  });
});
