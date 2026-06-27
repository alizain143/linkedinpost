import { PostMedia, PostMediaSource, PostMediaType } from '@prisma/client';

export interface PostMediaResponse {
  id: string;
  postPackageId: string;
  mediaType: PostMediaType;
  source: PostMediaSource;
  url: string;
  altText: string;
  sortOrder: number;
  mimeType: string;
  sizeBytes: number;
  createdAt: Date;
}

export interface AttachCouncilMediaInput {
  workspaceId: string;
  postPackageId: string;
  councilRunId: string;
  mediaType: PostMediaType;
  altText: string;
  imageBuffer: Buffer;
  mimeType: string;
}

export function toPostMediaResponse(
  media: PostMedia,
  url: string,
): PostMediaResponse {
  return {
    id: media.id,
    postPackageId: media.postPackageId,
    mediaType: media.mediaType,
    source: media.source,
    url,
    altText: media.altText,
    sortOrder: media.sortOrder,
    mimeType: media.mimeType,
    sizeBytes: media.sizeBytes,
    createdAt: media.createdAt,
  };
}
