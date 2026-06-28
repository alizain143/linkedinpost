export interface ImageReferenceCandidate {
  url: string;
  thumbnailUrl: string;
  title: string;
  sourcePage?: string;
}

export interface ImageScoutResult {
  queries: string[];
  candidates: ImageReferenceCandidate[];
}
