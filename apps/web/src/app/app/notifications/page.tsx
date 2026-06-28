import { Suspense } from "react";
import { Notifications } from "@/components/sections/app/notifications";

export default function NotificationsPage() {
  return (
    <Suspense fallback={null}>
      <Notifications />
    </Suspense>
  );
}
