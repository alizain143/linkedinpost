export const queryKeys = {
  currentUser: ["currentUser"] as const,
  workspaces: {
    all: ["workspaces"] as const,
    detail: (id: string) => ["workspaces", id] as const,
  },
  linkedin: {
    connection: (workspaceId: string) =>
      ["linkedin", workspaceId, "connection"] as const,
    profile: (workspaceId: string) =>
      ["linkedin", workspaceId, "profile"] as const,
    all: (workspaceId: string) => ["linkedin", workspaceId] as const,
  },
  credits: ["credits"] as const,
  posts: {
    list: (workspaceId: string, filters?: object) =>
      ["posts", workspaceId, filters] as const,
    detail: (workspaceId: string, postId: string) =>
      ["posts", workspaceId, postId] as const,
    versions: (workspaceId: string, postId: string) =>
      ["posts", workspaceId, postId, "versions"] as const,
    mediaVersions: (workspaceId: string, postId: string) =>
      ["posts", workspaceId, postId, "media-versions"] as const,
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
  notifications: {
    list: (params?: object) => ["notifications", params] as const,
    infinite: (params?: object) => ["notifications", "infinite", params] as const,
    unreadCount: ["notifications", "unreadCount"] as const,
  },
  mediaTemplates: {
    list: (workspaceId: string) => ["mediaTemplates", workspaceId] as const,
    detail: (workspaceId: string, id: string) =>
      ["mediaTemplates", workspaceId, id] as const,
  },
};
