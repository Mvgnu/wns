# Events Domain

Use this directory to describe cross-cutting concepts for event discovery, participation, and management.

## Current Focus Areas

- **Lifecycle management:** `lib/events/rsvp.ts` centralizes confirmation, waitlist, check-in, and feedback persistence.
- **Organizer console:** `app/events/manage/[id]/page.tsx` offers real-time roster control, attendance logging, and per-attendee feedback capture.
- **Automation:** `lib/cronService.ts` now sweeps waitlists every 30 minutes to fill open spots ahead of upcoming events while daily reminder jobs continue to operate.
