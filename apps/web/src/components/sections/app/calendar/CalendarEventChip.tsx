import Link from "next/link";
import type { ApiCalendarEvent } from "@/lib/api/types/calendar";
import {
  formatCalendarEventTime,
  getEventStatusStyle,
} from "@/lib/calendar-utils";

type CalendarEventChipProps = {
  event: ApiCalendarEvent;
  timezone?: string;
  className?: string;
};

export function CalendarEventChip({
  event,
  timezone,
  className = "",
}: CalendarEventChipProps) {
  const style = getEventStatusStyle(event.status);

  return (
    <Link
      href={`/app/posts/${event.id}`}
      title={event.hook}
      className={`block cursor-pointer rounded-md px-1.5 py-1 hover:brightness-[0.97] ${className}`}
      style={{ background: style.bg, borderLeft: `3px solid ${style.c}` }}
    >
      {timezone ? (
        <div
          className="mb-0.5 text-[10px] font-bold leading-tight"
          style={{ color: style.c }}
        >
          {formatCalendarEventTime(event.scheduledAt, timezone)}
        </div>
      ) : null}
      <div
        className="truncate text-[11px] font-semibold leading-tight"
        style={{ color: style.c }}
      >
        {event.hook}
      </div>
    </Link>
  );
}
