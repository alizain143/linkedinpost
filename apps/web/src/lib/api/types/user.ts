import type { UserPlan } from "./enums";

export type UserNotificationPrefs = {
  weeklyReminders: boolean;
  generationComplete: boolean;
  productUpdates: boolean;
};

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
  defaultWorkspaceId: string | null;
  createdAt: string;
  updatedAt: string;
};
