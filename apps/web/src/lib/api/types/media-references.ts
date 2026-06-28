import type { PostMediaType } from "@/lib/api/types/enums";

export type MediaReferenceCandidate = {
  url: string;
  thumbnailUrl: string;
  title: string;
  sourcePage?: string;
};

export type SubmitMediaReferencesBody = {
  selectedUrls: string[];
  mediaType?: PostMediaType;
  mediaCustomPrompt?: string;
  mediaTemplateId?: string;
};
