import { Injectable } from '@nestjs/common';
import { CouncilInput } from '../generation/generation.types';
import { GoogleImageSearchClient } from './google-image-search.client';
import { ImageScoutResult } from './image-scout.types';

@Injectable()
export class ImageScoutService {
  constructor(private readonly searchClient: GoogleImageSearchClient) {}

  buildQueries(input: CouncilInput, post: {
    hook: string;
    body?: string | null;
    topic?: string | null;
    pillar?: string | null;
  }): string[] {
    const topic = post.topic ?? input.topic ?? post.hook.slice(0, 80);
    const pillar = post.pillar ?? input.pillar;
    const industry = input.additionalContext?.slice(0, 60);

    const queries = [
      `${topic} professional concept`,
      pillar ? `${pillar} ${topic}` : `${topic} illustration`,
    ];

    if (industry) {
      queries.push(`${topic} ${industry}`);
    }

    return [...new Set(queries.map((q) => q.trim()).filter(Boolean))].slice(0, 3);
  }

  async scout(
    input: CouncilInput,
    post: {
      hook: string;
      body?: string | null;
      topic?: string | null;
      pillar?: string | null;
    },
  ): Promise<ImageScoutResult> {
    const queries = this.buildQueries(input, post);
    const seen = new Set<string>();
    const candidates: ImageScoutResult['candidates'] = [];

    for (const query of queries) {
      const results = await this.searchClient.searchImages(query, 3);
      for (const result of results) {
        if (seen.has(result.url)) continue;
        seen.add(result.url);
        candidates.push(result);
        if (candidates.length >= 8) break;
      }
      if (candidates.length >= 8) break;
    }

    return { queries, candidates };
  }
}
