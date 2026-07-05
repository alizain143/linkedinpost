import { Suspense } from "react";
import Calendar, {
  CalendarMonthSkeleton,
} from "@/components/sections/app/calendar/Calendar";

export default function CalendarPage() {
  return (
    <Suspense fallback={<CalendarMonthSkeleton />}>
      <Calendar />
    </Suspense>
  );
}
