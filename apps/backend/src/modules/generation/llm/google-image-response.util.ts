import type { GenerateContentResponse } from '@google/genai';

const SUPPORTED_IMAGE_MIME_TYPES = new Set(['image/png', 'image/jpeg']);

export function extractImageFromGenerateContentResponse(
  response: GenerateContentResponse,
): { buffer: Buffer; mimeType: string } | null {
  const parts = response.candidates?.[0]?.content?.parts ?? [];

  for (const part of parts) {
    const inlineData = part.inlineData;
    if (!inlineData?.data || !inlineData.mimeType) {
      continue;
    }

    if (!SUPPORTED_IMAGE_MIME_TYPES.has(inlineData.mimeType)) {
      continue;
    }

    return {
      buffer: Buffer.from(inlineData.data, 'base64'),
      mimeType: inlineData.mimeType,
    };
  }

  return null;
}
