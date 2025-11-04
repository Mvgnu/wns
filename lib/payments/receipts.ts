// metadata: feature=commerce-checkout channel=email
import { sendPaymentReceiptEmail } from '@/lib/email/email-service'
import prisma from '@/lib/prisma'

export type MembershipReceiptParams = {
  groupId: string
  membershipId?: string | null
  userId?: string | null
  amountCents: number
  currency: string
  occurredAt: Date
  stripeEventId: string
  stripeChargeId?: string | null
  stripePaymentIntentId?: string | null
  invoiceNumber?: string | null
  hostedInvoiceUrl?: string | null
  couponCode?: string | null
  description?: string | null
}

export async function sendMembershipReceiptNotification(params: MembershipReceiptParams) {
  const membership = params.membershipId
    ? await prisma.groupMembership.findUnique({
        where: { id: params.membershipId },
        select: {
          id: true,
          group: { select: { id: true, name: true, slug: true } },
          tier: { select: { name: true, billingPeriod: true } },
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              notificationPreferences: true,
            },
          },
        },
      })
    : null

  const user =
    membership?.user ??
    (params.userId
      ? await prisma.user.findUnique({
          where: { id: params.userId },
          select: {
            id: true,
            email: true,
            name: true,
            notificationPreferences: true,
          },
        })
      : null)

  if (!user?.email) {
    return
  }

  const group =
    membership?.group ??
    (await prisma.group.findUnique({
      where: { id: params.groupId },
      select: { id: true, name: true, slug: true },
    }))

  const groupName = group?.name ?? 'Group membership'
  const groupSlug = group?.slug ?? null
  const groupUrl = groupSlug
    ? `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.wns.local'}/groups/${groupSlug}`
    : null

  const membershipTierName = membership?.tier?.name ?? null
  const billingPeriod = membership?.tier?.billingPeriod ?? null

  await sendPaymentReceiptEmail({
    user,
    groupName,
    groupUrl,
    amountCents: params.amountCents,
    currency: params.currency,
    occurredAt: params.occurredAt,
    membershipTierName,
    billingPeriod,
    invoiceNumber: params.invoiceNumber ?? null,
    paymentIntentId: params.stripePaymentIntentId ?? null,
    chargeId: params.stripeChargeId ?? null,
    hostedInvoiceUrl: params.hostedInvoiceUrl ?? null,
    couponCode: params.couponCode ?? null,
    description: params.description ?? null,
    relatedId: params.stripeEventId,
  })
}
