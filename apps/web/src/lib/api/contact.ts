import { publicApiFetch } from "@/lib/api/fetch";
import type {
  SubmitContactBody,
  SubmitContactResponse,
} from "@/lib/api/types/contact";

export async function submitContact(
  body: SubmitContactBody,
): Promise<SubmitContactResponse> {
  return publicApiFetch<SubmitContactResponse>("/public/contact", {
    method: "POST",
    body: JSON.stringify(body),
  });
}
