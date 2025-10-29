# Analytics Aggregation

- feature: analytics-dashboard
- owner: insights
- status: experimental

This module houses the daily aggregation pipeline that rolls up event and group activity into
persisted metrics. The `generateDailyAnalyticsSnapshot` helper is called from scheduled jobs and
can also be triggered manually for ad-hoc backfills. Metrics are designed to respect the project's
minimal telemetry philosophy by relying on existing operational data (RSVPs, attendance, messages)
instead of raw tracking beacons.
