import type { PostType, UserPlan } from "@/lib/api/types/enums";

export type ApiDashboardCredits = {
  used: number;
  limit: number;
  percentUsed: number;
};

export type ApiDashboardCounts = {
  drafts: number;
  awaitingApproval: number;
  inProgress: number;
  scheduled: number;
  publishedThisMonth: number;
  generatedThisMonth: number;
};

export type ApiDashboardNextScheduled = {
  postId: string;
  hook: string;
  scheduledAt: string;
};

export type ApiDashboardRecentDraft = {
  id: string;
  hook: string;
  preview: string | null;
  postType: PostType | null;
  tone: string | null;
  pillar: string | null;
  updatedAt: string;
};

export type ApiDashboardStats = {
  plan: UserPlan;
  credits: ApiDashboardCredits;
  counts: ApiDashboardCounts;
  nextScheduled: ApiDashboardNextScheduled | null;
  recentDrafts: ApiDashboardRecentDraft[];
};
