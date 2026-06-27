import { User } from '@prisma/client';

export interface UserResponse {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  profileDocumentId: string | null;
  profileImageUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export function toUserResponse(
  user: User,
  profileImageUrl: string | null = user.profileImageUrl,
): UserResponse {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    profileDocumentId: user.profileDocumentId,
    profileImageUrl,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}
