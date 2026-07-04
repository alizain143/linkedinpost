import { ApiError } from "@/lib/api/client";

export function getApiErrorMessage(
  error: unknown,
  fallback = "Something went wrong. Try again.",
): string {
  if (error instanceof ApiError) {
    switch (error.code) {
      case "ACCOUNT_DELETED":
        return "This account has been deleted. Contact support if you need help.";
      case "UNAUTHORIZED":
        return "Your session expired. Please sign in again.";
      case "FILE_TYPE_NOT_ALLOWED":
        return "That file type is not allowed for profile photos.";
      case "UPLOAD_VERIFICATION_FAILED":
        return "Upload could not be verified. Try uploading again.";
      case "PENDING_UPLOAD_LIMIT":
        return "Too many pending uploads. Finish or cancel existing uploads first.";
      case "UPLOAD_EXPIRED":
        return "The upload window expired. Please try again.";
      case "CREDITS_EXHAUSTED":
        return "You're out of credits for this billing period. Upgrade your plan to keep generating.";
      case "PLAN_UPGRADE_REQUIRED":
        return (
          error.message ||
          "Upgrade your plan to unlock this feature."
        );
      case "AUTOPILOT_NO_PILLARS":
        return (
          error.message ||
          "Add at least one content pillar to your profile before enabling autopilot."
        );
      case "AUTOPILOT_NO_CONTENT_PROFILE":
        return (
          error.message ||
          "Add a content profile before enabling autopilot."
        );
      case "CALENDAR_SLOT_PLAN_FAILED":
        return (
          error.message ||
          "Could not plan enough slots for the selected posting days."
        );
      case "POST_NOT_EDITABLE":
        return "Only draft posts can be edited or deleted.";
      case "INVALID_STATUS_TRANSITION":
        return error.message || "That status change is not allowed.";
      case "RESOURCE_NOT_FOUND":
        return "That post could not be found.";
      case "LINKEDIN_NOT_CONNECTED":
        return "Connect LinkedIn with publish permissions to continue.";
      case "LINKEDIN_SCOPE_MISSING":
        return "Finish LinkedIn setup to grant publish permission.";
      case "REDIS_UNAVAILABLE":
        return "Background jobs are temporarily unavailable. Try again shortly.";
      case "POST_ALREADY_HAS_MEDIA":
        return "This post already has media attached.";
      case "MEDIA_JOB_IN_PROGRESS":
        return "Media generation is already running for this post.";
      case "INVALID_POST_STATUS":
        return error.message || "Media can only be generated for draft posts.";
      case "MEDIA_GENERATION_FAILED":
        return error.message || "Image generation failed. Try again.";
      case "COUNCIL_CONTEXT_ERROR":
        return error.message || "Check your content profile and try again.";
      case "COUNCIL_AGENT_FAILED":
      case "COUNCIL_PARSE_ERROR":
      case "COUNCIL_MEDIA_STUB_FAILED":
        return error.message || fallback;
      case "SCHEDULED_AT_REQUIRED":
        return "Pick a date and time to schedule this post.";
      case "SCHEDULE_TOO_SOON":
      case "SCHEDULE_TOO_FAR":
        return error.message || fallback;
      case "BILLING_UNAVAILABLE":
        return "Billing is not available right now. Try again later.";
      case "ALREADY_SUBSCRIBED":
        return "You're already on this plan.";
      case "BILLING_ACCOUNT_REQUIRED":
        return "No billing account found. Subscribe to a plan first.";
      case "NO_ACTIVE_SUBSCRIPTION":
        return "No active subscription to cancel.";
      case "CLIENT_WORKSPACE_LIMIT":
        return "You can have at most 5 client workspaces.";
      case "WORKSPACE_FORBIDDEN":
        return (
          error.message ||
          "You don't have permission to modify this workspace."
        );
      case "APPROVAL_LINK_INVALID":
        return "This approval link is invalid, expired, or already used.";
      case "POST_NOT_AWAITING_APPROVAL":
        return "This post is not awaiting approval.";
      default:
        return error.message || fallback;
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}
