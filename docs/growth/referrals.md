# Referral Growth Loops

Referral helpers generate durable codes, log invite state transitions, and summarise funnel health. Use them whenever you need to:

- provision a referral code for a member (`ensureReferralCode`)
- log new invites (`recordReferralInvite`)
- transition to accepted/completed states (`markReferralAccepted`, `markReferralCompleted`)
- render progress dashboards (`getReferralSummary`)

These APIs rely on the Prisma models `ReferralCode` and `Referral` introduced for the growth engine.
