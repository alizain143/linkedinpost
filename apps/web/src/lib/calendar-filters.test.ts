import {
  CALENDAR_ALL_STATUSES,
  calendarFilterToStatuses,
  parseCalendarFilter,
} from "@/lib/calendar-filters";

describe("calendar-filters", () => {
  it("returns all statuses for All filter", () => {
    expect(calendarFilterToStatuses("All")).toEqual(CALENDAR_ALL_STATUSES);
  });

  it("maps Ready for Approval to ready_for_approval", () => {
    expect(calendarFilterToStatuses("Ready for Approval")).toEqual([
      "ready_for_approval",
    ]);
  });

  it("accepts legacy Needs Approval URL value", () => {
    expect(parseCalendarFilter("Needs Approval")).toBe("Ready for Approval");
  });
});
