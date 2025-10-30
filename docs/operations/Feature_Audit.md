# Feature Audit — Monetization Readiness Pass

## Organizer Console
- The server component eagerly throws upstream errors from `getOrganizerConsoleData` without a console-facing fallback, which results in a 500 for transient data issues instead of surfacing recovery guidance. Tighten resilience by adding structured error states and telemetry for `GROUP_NOT_FOUND`/`UNAUTHORIZED` branches before the general rethrow. (See `app/groups/manage/[slug]/page.tsx`.)
- Membership tier tables and forms render immediately without suspense or loading skeletons even though they depend on asynchronous server actions. Introduce optimistic UI affordances so organizers receive feedback while `createTierAction`/`updateTierAction` execute. (See `app/groups/manage/[slug]/page.tsx`.)
- **Follow-up:** Track remediation under [AUD-001](./Problem_Tracker_FeatureAudit.md#aud-001-organizer-console-resilience-refresh).

## Group Chat Surface
- The `EventSource` error handler closes the stream and schedules a conversation refetch but never restarts the SSE connection, leaving chat updates frozen until the page reloads. Add reconnection with backoff and a visible offline banner. (See `components/chat/GroupChatPanel.tsx`.)
- Message sending lacks retry/back-pressure management; failures simply fall through with `sendingMessage` stuck true. Add error toasts and ensure the pending flag resets on exceptions. (See `components/chat/GroupChatPanel.tsx`.)
- **Follow-up:** Logged as [AUD-002](./Problem_Tracker_FeatureAudit.md#aud-002-group-chat-realtime-hardening).
- **Status:** In progress — reconnection loop, offline indicator, and send error toasts landed 2024-05-23.

## Onboarding Wizard
- The wizard collapses all validation failures into a generic banner, forcing users to guess which field misbehaved. Provide field-level annotations (e.g., for blank sports or invalid radius) before calling `mutateStep`. (See `components/onboarding/OnboardingWizard.tsx`.)
- `mutateStep` issues sequential POSTs without timeout/abort handling, so flaky connections trap users in a spinner. Instrument abortable fetches and telemetry to capture API latencies. (See `components/onboarding/OnboardingWizard.tsx`.)
- **Follow-up:** Captured in [AUD-003](./Problem_Tracker_FeatureAudit.md#aud-003-onboarding-validation--telemetry).

## Analytics Dashboard
- Dashboard queries pull 30 rows of historical metrics on each request without lightweight caching or pagination, which is viable now but will degrade as the table grows. Add segmented data APIs plus lazy loading for the historical table. (See `app/admin/analytics/page.tsx`.)
- Operator context lacks trend visualization or alert thresholds despite collecting `dailyPlatformMetric` data. Layer sparkline cards and baseline comparisons to make anomalies visible. (See `app/admin/analytics/page.tsx`.)
- **Follow-up:** Managed through [AUD-004](./Problem_Tracker_FeatureAudit.md#aud-004-analytics-scalability--visualization).

## Cross-Surface Quality Wins
- Resolved accessibility lint noise by aliasing decorative lucide `<Image>` icons to `<ImageIcon>` in event and location amenities plus the feed composer. (See `components/events/EventAmenities.tsx`, `components/locations/PlaceAmenities.tsx`, and `components/feed/CreateFeedPostForm.tsx`.)
- Replaced `any`-based wrappers in shared UI controls with typed props (`MediaUploader`, `RichTextEditor`) to keep the harness compatible with stricter linting and telemetry annotations. (See `components/ui/MediaUploader.tsx` and `components/ui/RichTextEditor.tsx`.)

## Payments & Commerce
- Stripe webhook now records membership refunds and chargeback disputes into dedicated audit tables while pushing negative adjustments into the revenue ledger, advancing the commerce risk milestone. (See `app/api/payments/stripe/webhook/route.ts` and `lib/payments/audit.ts`.)
- Organizer console surfaces now include revenue summaries, coupon catalogs, and payout orchestration, enabling organizers to self-serve monetization levers without leaving the platform. (See `app/groups/manage/[slug]/page.tsx` and `lib/groups/organizer-console.ts`.)
- **Status:** Logged in [CM-001](./Problem_Tracker_Commerce.md) as part of Dispute & Refund Automation progress (2025-10-31 update).
