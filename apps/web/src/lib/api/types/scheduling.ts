export type SchedulePostBody = {
  scheduledAt: string;
};

export type ScheduleModalMode = "schedule" | "reschedule";

export type ScheduleTarget = {
  postId: string;
  hook: string;
  mode: ScheduleModalMode;
  scheduledAt?: string | null;
};

export type PublishTarget = {
  postId: string;
  hook: string;
};
