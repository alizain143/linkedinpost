import type { UserPlan } from "./enums";

export type UserNotificationPrefs = {
  weeklyReminders: boolean;
  generationComplete: boolean;
  productUpdates: boolean;
  publishAlerts: boolean;
  pushEnabled: boolean;
};

export type ToursSeenMap = Record<string, string>;

export type ApiUser = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  profileDocumentId: string | null;
  profileImageUrl: string | null;
  timezone: string;
  notifications: UserNotificationPrefs;
  plan: UserPlan;
  toursSeen: ToursSeenMap;
  lastAcknowledgedPlan: UserPlan | null;
  defaultWorkspaceId: string | null;
  createdAt: string;
  updatedAt: string;
};
