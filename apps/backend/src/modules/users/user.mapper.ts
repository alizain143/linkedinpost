import { User, UserPlan } from '@prisma/client';

export interface UserNotificationPrefs {
  weeklyReminders: boolean;
  generationComplete: boolean;
  productUpdates: boolean;
}

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
  defaultWorkspaceId: string | null;
  createdAt: Date;
  updatedAt: Date;
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
    },
    plan: user.plan,
    defaultWorkspaceId,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}
