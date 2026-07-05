import { describe, expect, it } from "vitest";
import { versionMatchesPost } from "@/lib/post-version-utils";
import type { ApiPostPackage, ApiPostVersion } from "@/lib/api/types/post";

const basePost: ApiPostPackage = {
  id: "post-1",
  workspaceId: "ws-1",
  contentProfileId: null,
  hook: "Hello world",
  body: "Body text",
  cta: "Follow me",
  tags: ["tag-a"],
  topic: null,
  postType: null,
  tone: null,
  pillar: null,
  source: "manual",
  status: "draft",
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
  versionNumber: 3,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  media: [],
};

const baseVersion: ApiPostVersion = {
  id: "version-1",
  postPackageId: "post-1",
  versionNumber: 1,
  hook: "Hello world",
  body: "Body text",
  cta: "Follow me",
  tags: ["tag-a"],
  createdAt: "2026-01-01T00:00:00.000Z",
};

describe("versionMatchesPost", () => {
  it("matches when content fields are identical", () => {
    expect(versionMatchesPost(baseVersion, basePost)).toBe(true);
  });

  it("does not match when hook differs", () => {
    expect(
      versionMatchesPost({ ...baseVersion, hook: "Different hook" }, basePost),
    ).toBe(false);
  });

  it("does not match when version number differs but that alone is ignored", () => {
    expect(
      versionMatchesPost({ ...baseVersion, versionNumber: 99 }, basePost),
    ).toBe(true);
  });
});
