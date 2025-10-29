# Event Organizer Console

This segment hosts the client experience for `/events/manage/[id]`, giving organizers real-time controls to:

- Inspect RSVP summaries and waitlist counts without leaving the page.
- Confirm, waitlist, cancel, and check-in attendees directly against the RSVP service.
- Capture structured post-event feedback per participant.

The page consumes the organizer-specific API at `/api/events/:id/rsvp` and expects the caller to hold organizer or co-organizer privileges. Use this README to document future enhancements (bulk actions, exports, etc.).
