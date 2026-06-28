"use client";

import { useNotificationsContainer } from "./NotificationsContainer";
import { NotificationsView } from "./NotificationsComponents";

export function Notifications() {
  const props = useNotificationsContainer();
  return <NotificationsView {...props} />;
}
