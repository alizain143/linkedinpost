export const queryKeys = {
  currentUser: ["currentUser"] as const,
  workspaces: {
    all: ["workspaces"] as const,
    detail: (id: string) => ["workspaces", id] as const,
  },
  linkedin: {
    connection: ["linkedin", "connection"] as const,
    profile: ["linkedin", "profile"] as const,
  },
  credits: ["credits"] as const,
  posts: {
    list: (workspaceId: string, filters?: object) =>
      ["posts", workspaceId, filters] as const,
    detail: (workspaceId: string, postId: string) =>
      ["posts", workspaceId, postId] as const,
    versions: (workspaceId: string, postId: string) =>
      ["posts", workspaceId, postId, "versions"] as const,
  },
  jobs: {
    detail: (jobId: string) => ["jobs", jobId] as const,
  },
  contentProfiles: {
    list: (workspaceId: string) => ["contentProfiles", workspaceId] as const,
    detail: (workspaceId: string, profileId: string) =>
      ["contentProfiles", workspaceId, profileId] as const,
  },
  dashboard: {
    stats: (workspaceId: string) =>
      ["dashboard", workspaceId, "stats"] as const,
  },
  pipeline: {
    board: (workspaceId: string, params?: object) =>
      ["pipeline", workspaceId, params] as const,
  },
  approvals: {
    queue: (workspaceId: string, params?: object) =>
      ["approvals", workspaceId, params] as const,
  },
  calendar: {
    events: (workspaceId: string, params?: object) =>
      ["calendar", workspaceId, params] as const,
  },
  council: {
    history: (workspaceId: string, postId: string) =>
      ["council", workspaceId, postId] as const,
  },
  autopilot: {
    config: (workspaceId: string) =>
      ["autopilot", workspaceId, "config"] as const,
    planned: (workspaceId: string) =>
      ["autopilot", workspaceId, "planned"] as const,
  },
  billing: {
    status: ["billing", "status"] as const,
  },
  approvalShare: {
    status: (workspaceId: string, postId: string) =>
      ["approvalShare", workspaceId, postId, "status"] as const,
  },
  publicApproval: {
    preview: (token: string) => ["publicApproval", token] as const,
  },
};
