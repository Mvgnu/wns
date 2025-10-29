import { EventAttendanceAction, EventRSVPStatus } from "@prisma/client";
import { mapStatusToAttendanceAction, RsvpError } from "@/lib/events/rsvp";

describe("mapStatusToAttendanceAction", () => {
  const cases: Array<[EventRSVPStatus, EventAttendanceAction]> = [
    [EventRSVPStatus.CONFIRMED, EventAttendanceAction.RSVP_CONFIRMED],
    [EventRSVPStatus.CHECKED_IN, EventAttendanceAction.CHECKED_IN],
    [EventRSVPStatus.WAITLISTED, EventAttendanceAction.RSVP_WAITLISTED],
    [EventRSVPStatus.CANCELLED, EventAttendanceAction.RSVP_CANCELLED],
    [EventRSVPStatus.NO_SHOW, EventAttendanceAction.MARKED_NO_SHOW],
  ];

  it.each(cases)("maps %s to %s", (status, expectedAction) => {
    expect(mapStatusToAttendanceAction(status)).toBe(expectedAction);
  });
});

describe("RsvpError", () => {
  it("persists message and code", () => {
    const error = new RsvpError("full", "WAITLIST_DISABLED");
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe("full");
    expect(error.code).toBe("WAITLIST_DISABLED");
  });

  it("supports additional lifecycle codes", () => {
    const codes: RsvpError["code"][] = [
      "ALREADY_CHECKED_IN",
      "INVALID_FEEDBACK_RATING",
      "NOT_WAITLISTED",
    ];

    for (const code of codes) {
      const error = new RsvpError("test", code);
      expect(error.code).toBe(code);
    }
  });
});
