import { PostMedia, PostMediaType } from '@prisma/client';

export interface PostMediaResponse {
  id: string;
  postPackageId: string;
  mediaType: PostMediaType;
  url: string;
  altText: string;
  sortOrder: number;
  mimeType: string;
  sizeBytes: number;
  createdAt: Date;
  isActive: boolean;
}

export interface AttachCouncilMediaInput {
  workspaceId: string;
  postPackageId: string;
  generationJobId: string;
  mediaType: PostMediaType;
  altText: string;
  imageBuffer: Buffer;
  mimeType: string;
}

export interface AttachCarouselSlideInput {
  mediaType: PostMediaType;
  altText: string;
  imageBuffer: Buffer;
  mimeType: string;
  sortOrder: number;
}

export interface AttachCarouselMediaInput {
  workspaceId: string;
  postPackageId: string;
  generationJobId: string;
  slides: AttachCarouselSlideInput[];
}

export function toPostMediaResponse(
  media: PostMedia,
  url: string,
): PostMediaResponse {
  return {
    id: media.id,
    postPackageId: media.postPackageId,
    mediaType: media.mediaType,
    url,
    altText: media.altText,
    sortOrder: media.sortOrder,
    mimeType: media.mimeType,
    sizeBytes: media.sizeBytes,
    createdAt: media.createdAt,
    isActive: media.archivedAt == null,
  };
}
