# Event RSVP & Attendance Lifecycle

## Overview
- **Status model:** RSVPs are stored in the `EventRSVP` table with explicit status transitions (`CONFIRMED`, `WAITLISTED`, `CANCELLED`, `CHECKED_IN`, `NO_SHOW`).
- **Capacity snapshotting:** Helper utilities in `lib/events/rsvp.ts` enforce capacity rules, update `Event.isSoldOut`, and emit `EventAttendanceLog` records for auditability.
- **Waitlist automation:** When an attendee cancels, the earliest waitlisted entry is promoted automatically and the organizer notification is triggered.

## API Surface
- `POST /api/events/:id/attend` – Creates or updates the caller's RSVP. Responds with `{ status, waitlisted, summary }` so clients can adjust UI without reloading.
- `DELETE /api/events/:id/attend` – Marks the RSVP as cancelled, disconnects the attendee, promotes the next waitlisted user, and returns the updated summary payload.
- `GET /api/events/:id` – Returns `attendanceSummary` (confirmed, waitlist, capacity, full) plus raw RSVP records for richer attendee UIs.
- `GET /api/events/:id/rsvp` – Organizer-only endpoint that returns RSVP roster, aggregated attendance summary, and post-event feedback with rating averages.
- `POST /api/events/:id/rsvp` – Organizer control surface accepting actions (`confirm`, `waitlist`, `cancel`, `check-in`, `no-show`, `sweep-waitlist`, `feedback`). Each call responds with the refreshed roster, feedback ledger, and summary metrics.

## Client Expectations
- Show capacity using `attendanceSummary.confirmedCount` and `capacity`.
- Display waitlist badge when `attendance.status === "WAITLISTED"`.
- When the summary reports `isFull === true`, calls to join should surface “waitlist” messaging.
- Respect `summary.waitlistCount` for surfacing backlog size.

## Feedback & Waitlist Automation
- `EventFeedback` records store 1–5 ratings plus optional comments scoped to event+user combinations.
- Waitlist promotion is triggered on cancellations and via the half-hour sweep job configured in `lib/cronService.ts` (12-hour lookahead window).
- Organizer tooling in `app/events/manage/[id]/page.tsx` consumes the new RSVP API to surface check-in buttons, waitlist management, and feedback capture dialogs.

## Future Hooks
- Extend `sweepWaitlistsForUpcomingEvents` to push notifications when promotions occur.
- Enrich feedback reporting with sentiment analysis or export routines once adoption grows.
