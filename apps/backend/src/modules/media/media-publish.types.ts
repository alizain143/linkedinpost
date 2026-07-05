export interface PublishMediaPayload {
  buffer: Buffer;
  mimeType: string;
  altText: string;
}

export type PublishMediaListPayload = PublishMediaPayload[];
