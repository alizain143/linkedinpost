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
  | "awaiting_media_selection"
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
  | "case_study"
  | "question_post"
  | "framework"
  | "myth_buster"
  | "prediction"
  | "behind_the_scenes"
  | "comparison";

export type PostMediaType =
  | "quote_card"
  | "branded_quote_card"
  | "stat_highlight"
  | "tip_card"
  | "infographic"
  | "photo_illustration"
  | "generated";

export type GenerationJobStatus =
  | "pending"
  | "running"
  | "completed"
  | "failed";

export type GenerationJobType = "quick_draft" | "council" | "calendar" | "media";
