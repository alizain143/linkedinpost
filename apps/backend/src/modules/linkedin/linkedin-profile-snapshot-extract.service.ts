import { Inject, Injectable } from '@nestjs/common';
import { MODEL_ROUTER } from '../generation/llm/model-capability.types';
import type { ModelRouter } from '../generation/llm/model-capability.types';
import { ExtractLinkedInProfileSnapshotDto } from './dto/extract-linkedin-profile-snapshot.dto';
import {
  buildLinkedInProfileExtractUserPrompt,
  LINKEDIN_PROFILE_EXTRACT_V1_SYSTEM,
} from './prompts/linkedin-profile-extract.v1';
import {
  ExtractedLinkedInProfile,
  LinkedInProfileSnapshotOutputParser,
} from './linkedin-profile-snapshot-output.parser';
import { ProfileImportTokenService } from './profile-import-token.service';

const MAX_HTML_CHARS = 500_000;
const MAX_TEXT_CHARS = 100_000;

@Injectable()
export class LinkedInProfileSnapshotExtractService {
  constructor(
    @Inject(MODEL_ROUTER) private readonly modelRouter: ModelRouter,
    private readonly outputParser: LinkedInProfileSnapshotOutputParser,
    private readonly importTokenService: ProfileImportTokenService,
  ) {}

  async extractFromSnapshot(
    workspaceId: string,
    dto: ExtractLinkedInProfileSnapshotDto,
  ): Promise<ExtractedLinkedInProfile> {
    this.importTokenService.verifyToken(dto.importToken, workspaceId);

    const pageText = dto.pageText.slice(0, MAX_TEXT_CHARS);
    const mainHtml = (dto.mainHtml ?? '').slice(0, MAX_HTML_CHARS);

    const completion = await this.modelRouter.text().complete({
      messages: [
        { role: 'system', content: LINKEDIN_PROFILE_EXTRACT_V1_SYSTEM },
        {
          role: 'user',
          content: buildLinkedInProfileExtractUserPrompt({
            profileUrl: dto.profileUrl,
            pageText,
            mainHtml,
          }),
        },
      ],
      responseFormat: 'json',
      temperature: 0.2,
      maxTokens: 4096,
    });

    return this.outputParser.parse(completion.content, dto.profileUrl);
  }
}
