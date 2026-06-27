export interface CreateFromClerkDto {
  clerkId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
  hasClerkProfileImage?: boolean;
}
