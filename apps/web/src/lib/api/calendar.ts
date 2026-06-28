import { apiFetch } from "@/lib/api/fetch";
import type {
  ApiCalendarResponse,
  CalendarQueryParams,
} from "@/lib/api/types/calendar";

function buildCalendarQuery(params: CalendarQueryParams): string {
  const search = new URLSearchParams();
  search.set("view", params.view);
  if (params.date) search.set("date", params.date);
  if (params.status?.length) {
    search.set("status", params.status.join(","));
  }
  if (params.limit !== undefined) {
    search.set("limit", String(params.limit));
  }
  return `?${search.toString()}`;
}

export async function fetchCalendar(
  token: string,
  workspaceId: string,
  params: CalendarQueryParams,
): Promise<ApiCalendarResponse> {
  return apiFetch<ApiCalendarResponse>(
    token,
    `/workspaces/${workspaceId}/calendar${buildCalendarQuery(params)}`,
  );
}
