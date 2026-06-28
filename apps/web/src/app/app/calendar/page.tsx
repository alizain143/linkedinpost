import { Suspense } from "react";
import { Calendar } from "@/components/sections/app/calendar";

export default function CalendarPage() {
  return (
    <Suspense fallback={null}>
      <Calendar />
    </Suspense>
  );
}
