"use client";

import { useMutation } from "@tanstack/react-query";
import { submitContact } from "@/lib/api/contact";
import type {
  SubmitContactBody,
  SubmitContactResponse,
} from "@/lib/api/types/contact";

export function useSubmitContactMutation() {
  return useMutation<SubmitContactResponse, Error, SubmitContactBody>({
    mutationFn: (body) => submitContact(body),
  });
}
