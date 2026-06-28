import { Injectable, Logger } from '@nestjs/common';

const SUPPORTED_MIME = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/gif']);

@Injectable()
export class ImageReferenceDownloaderService {
  private readonly logger = new Logger(ImageReferenceDownloaderService.name);

  async downloadReferences(
    urls: string[],
    max = 3,
  ): Promise<Array<{ buffer: Buffer; mimeType: string }>> {
    const selected = urls.slice(0, max);
    const results: Array<{ buffer: Buffer; mimeType: string }> = [];

    for (const url of selected) {
      try {
        const response = await fetch(url, {
          signal: AbortSignal.timeout(10_000),
        });
        if (!response.ok) continue;

        const contentType = response.headers.get('content-type') ?? 'image/jpeg';
        const mimeType = contentType.split(';')[0].trim();
        if (!SUPPORTED_MIME.has(mimeType)) continue;

        const arrayBuffer = await response.arrayBuffer();
        results.push({
          buffer: Buffer.from(arrayBuffer),
          mimeType,
        });
      } catch (error) {
        this.logger.warn(`Failed to download reference image: ${url}`, error);
      }
    }

    return results;
  }
}
