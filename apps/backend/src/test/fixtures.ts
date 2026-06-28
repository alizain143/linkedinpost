import {
  ContentGoal,
  ContentProfile,
  ContentPillar,
  PostPackage,
  PostPackageStatus,
  PostSource,
  PostType,
  PostVersion,
  User,
  UserPlan,
  Workspace,
  WorkspaceType,
} from '@prisma/client';

const now = new Date('2026-06-27T12:00:00.000Z');

export const workspaceId = '11111111-1111-1111-1111-111111111111';
export const userId = '22222222-2222-2222-2222-222222222222';
export const postId = '33333333-3333-3333-3333-333333333333';
export const contentProfileId = '55555555-5555-5555-5555-555555555555';

export function buildWorkspace(overrides: Partial<Workspace> = {}): Workspace {
  return {
    id: workspaceId,
    name: 'Test Workspace',
    type: WorkspaceType.personal,
    ownerId: userId,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    ...overrides,
  };
}

export function buildUser(overrides: Partial<User> = {}): User {
  return {
    id: userId,
    clerkId: 'clerk_test',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    profileDocumentId: null,
    profileImageUrl: null,
    timezone: 'America/New_York',
    emailWeeklyReminders: true,
    emailGenerationComplete: true,
    emailProductUpdates: false,
    emailPublishAlerts: true,
    pushEnabled: true,
    plan: UserPlan.pro,
    linkedInMemberId: null,
    linkedInProfileSyncedAt: null,
    linkedInProfile: null,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    ...overrides,
  };
}

export function buildPost(overrides: Partial<PostPackage> = {}): PostPackage {
  return {
    id: postId,
    workspaceId,
    contentProfileId: null,
    hook: 'Test hook',
    body: 'Test body',
    cta: null,
    tags: [],
    topic: null,
    postType: PostType.personal_story,
    tone: 'Bold',
    pillar: 'Founder lessons',
    source: PostSource.manual,
    status: PostPackageStatus.draft,
    score: null,
    scheduledAt: null,
    publishedAt: null,
    linkedInPostId: null,
    linkedInPostUrl: null,
    publishErrorCode: null,
    publishErrorMessage: null,
    publishAttemptedAt: null,
    submittedForApprovalAt: null,
    approvalFeedback: null,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    ...overrides,
  };
}

export function buildPostVersion(
  overrides: Partial<PostVersion> = {},
): PostVersion {
  return {
    id: '44444444-4444-4444-4444-444444444444',
    postPackageId: postId,
    versionNumber: 1,
    hook: 'Test hook',
    body: 'Test body',
    cta: null,
    tags: [],
    createdAt: now,
    ...overrides,
  };
}

export function buildContentProfile(
  overrides: Partial<ContentProfile> = {},
): ContentProfile & { pillars: ContentPillar[] } {
  return {
    id: contentProfileId,
    workspaceId,
    name: 'Maya',
    roleTitle: 'Founder',
    industry: 'SaaS',
    targetAudience: 'Founders',
    contentGoal: ContentGoal.build_authority,
    preferredTone: 'Bold',
    offerDescription: 'Coaching for founders',
    writingSample: 'I ship weekly.',
    avoidWords: 'synergy',
    isDefault: true,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    pillars: [
      {
        id: '66666666-6666-6666-6666-666666666666',
        contentProfileId,
        name: 'Founder lessons',
        sortOrder: 0,
      },
    ],
    ...overrides,
  };
}
