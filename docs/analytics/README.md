# Analytics Dashboards

- feature: analytics-dashboard
- audience: operations
- status: experimental

## Snapshot Cadence
Daily snapshots are generated shortly after 02:00 server time via the cron scheduler. Backfills can
be executed by invoking `generateDailyAnalyticsSnapshot` with a historical date or using the
manual cron runner.

## Metric Definitions
- **Active Members**: unique users who either checked into an event or posted in a group chat on the
  snapshot day.
- **New Members**: users created within the snapshot window.
- **Events Created**: events whose records were created in the window.
- **RSVP Total**: RSVP submissions created in the window.
- **Check-ins**: attendance logs with the `CHECKED_IN` action captured in the window.
- **Feedback Count**: event feedback submissions created in the window.

Group-level snapshots use the same primitives but are filtered by the associated group. Attendance
and feedback are derived from the event relationships to guarantee contextual integrity.

## Admin Dashboard
The admin route `/admin/analytics` surfaces the latest 30 days of platform metrics plus the most
engaged groups for quick operator insights. Access is limited to admin users through the shared
session guard.
