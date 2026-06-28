import Link from "next/link";
import type { ApiCalendarEvent } from "@/lib/api/types/calendar";
import { getEventStatusStyle } from "@/lib/calendar-utils";

type CalendarEventChipProps = {
  event: ApiCalendarEvent;
  className?: string;
};

export function CalendarEventChip({ event, className = "" }: CalendarEventChipProps) {
  const style = getEventStatusStyle(event.status);

  return (
    <Link
      href={`/app/posts/${event.id}`}
      className={`block cursor-pointer rounded-md px-1.5 py-1 hover:brightness-[0.97] ${className}`}
      style={{ background: style.bg, borderLeft: `3px solid ${style.c}` }}
    >
      <div
        className="truncate text-[11px] font-semibold leading-tight"
        style={{ color: style.c }}
      >
        {event.hook}
      </div>
    </Link>
  );
}
