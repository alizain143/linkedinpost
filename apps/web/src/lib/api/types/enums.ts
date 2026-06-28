export type WorkspaceType = "personal" | "client";

export type UserPlan = "free" | "starter" | "pro" | "agency";

export type ContentGoal =
  | "build_authority"
  | "generate_leads"
  | "grow_audience";

export type PostPackageStatus =
  | "draft"
  | "text_generating"
  | "text_reviewing"
  | "media_generating"
  | "ready_for_approval"
  | "approved"
  | "scheduled"
  | "publishing"
  | "published"
  | "failed";

export type PostSource =
  | "manual"
  | "generation"
  | "calendar"
  | "autopilot";

export type PostType =
  | "personal_story"
  | "list_post"
  | "how_to"
  | "contrarian_take"
  | "hot_take"
  | "case_study";

export type GenerationJobStatus =
  | "pending"
  | "running"
  | "completed"
  | "failed";

export type GenerationJobType = "quick_draft" | "council" | "calendar" | "media";
