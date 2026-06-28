import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ImageReferenceCandidate } from './image-scout.types';

@Injectable()
export class GoogleImageSearchClient {
  private readonly logger = new Logger(GoogleImageSearchClient.name);

  constructor(private readonly configService: ConfigService) {}

  isConfigured(): boolean {
    return Boolean(this.configService.get<string>('google.cseApiKey')) &&
      Boolean(this.configService.get<string>('google.cseCx'));
  }

  async searchImages(
    query: string,
    limit = 4,
  ): Promise<ImageReferenceCandidate[]> {
    const apiKey = this.configService.get<string>('google.cseApiKey');
    const cx = this.configService.get<string>('google.cseCx');

    if (!apiKey || !cx) {
      return this.mockCandidates(query);
    }

    const url = new URL('https://www.googleapis.com/customsearch/v1');
    url.searchParams.set('key', apiKey);
    url.searchParams.set('cx', cx);
    url.searchParams.set('q', query);
    url.searchParams.set('searchType', 'image');
    url.searchParams.set('num', String(Math.min(limit, 10)));
    url.searchParams.set('safe', 'active');

    try {
      const response = await fetch(url.toString());
      if (!response.ok) {
        this.logger.warn(`Google CSE failed: ${response.status}`);
        return this.mockCandidates(query);
      }

      const data = (await response.json()) as {
        items?: Array<{
          title?: string;
          link?: string;
          image?: { thumbnailLink?: string; contextLink?: string };
        }>;
      };

      return (data.items ?? [])
        .filter((item) => item.link && item.image?.thumbnailLink)
        .map((item) => ({
          url: item.link!,
          thumbnailUrl: item.image!.thumbnailLink!,
          title: item.title ?? query,
          sourcePage: item.image?.contextLink,
        }));
    } catch (error) {
      this.logger.warn('Google CSE request error', error);
      return this.mockCandidates(query);
    }
  }

  private mockCandidates(query: string): ImageReferenceCandidate[] {
    return Array.from({ length: 4 }, (_, index) => ({
      url: `https://picsum.photos/seed/${encodeURIComponent(query)}-${index}/800/600`,
      thumbnailUrl: `https://picsum.photos/seed/${encodeURIComponent(query)}-${index}/200/150`,
      title: `${query} reference ${index + 1}`,
      sourcePage: 'https://picsum.photos',
    }));
  }
}
