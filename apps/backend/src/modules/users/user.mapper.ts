import { Prisma, User, UserPlan } from '@prisma/client';

export interface UserNotificationPrefs {
  weeklyReminders: boolean;
  generationComplete: boolean;
  productUpdates: boolean;
  publishAlerts: boolean;
  pushEnabled: boolean;
}

export type ToursSeenMap = Record<string, string>;

export interface UserResponse {
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
  createdAt: Date;
  updatedAt: Date;
}

export function parseToursSeen(value: Prisma.JsonValue | null): ToursSeenMap {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }

  const result: ToursSeenMap = {};
  for (const [key, entry] of Object.entries(value)) {
    if (typeof entry === 'string') {
      result[key] = entry;
    }
  }
  return result;
}

export function toUserResponse(
  user: User,
  profileImageUrl: string | null = user.profileImageUrl,
  defaultWorkspaceId: string | null = null,
): UserResponse {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    profileDocumentId: user.profileDocumentId,
    profileImageUrl,
    timezone: user.timezone,
    notifications: {
      weeklyReminders: user.emailWeeklyReminders,
      generationComplete: user.emailGenerationComplete,
      productUpdates: user.emailProductUpdates,
      publishAlerts: user.emailPublishAlerts,
      pushEnabled: user.pushEnabled,
    },
    plan: user.plan,
    toursSeen: parseToursSeen(user.toursSeen),
    lastAcknowledgedPlan: user.lastAcknowledgedPlan,
    defaultWorkspaceId,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}
