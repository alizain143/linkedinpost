import Link from "next/link";
import type { ApiCalendarEvent } from "@/lib/api/types/calendar";
import {
  formatCalendarEventTime,
  getEventStatusStyle,
} from "@/lib/calendar-utils";
import { PostMediaThumbnail } from "@/components/ui/post-media-thumbnail";

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
  const hasMedia = (event.media?.length ?? 0) > 0;

  return (
    <Link
      href={`/app/posts/${event.id}`}
      title={event.hook}
      className={`block cursor-pointer rounded-md px-1.5 py-1 hover:brightness-[0.97] ${className}`}
      style={{ background: style.bg, borderLeft: `3px solid ${style.c}` }}
    >
      <div className="flex items-start gap-1.5">
        {hasMedia ? (
          <PostMediaThumbnail media={event.media} className="mt-0.5 h-6 w-6" />
        ) : null}
        <div className="min-w-0 flex-1">
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
        </div>
      </div>
    </Link>
  );
}
