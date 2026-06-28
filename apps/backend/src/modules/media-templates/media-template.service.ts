import { Injectable, Logger } from '@nestjs/common';
import { PostMediaType } from '@prisma/client';
import { Resvg } from '@resvg/resvg-js';
import { MediaCreatorOutput } from '../council/parsers/media-creator-output.parser';
import { GenerationContentProfileContext } from '../generation/generation.types';
import {
  isCatalogTemplateId,
} from './media-template-catalog';
import {
  buildBrandedQuoteCardSvg,
  buildEducationalPostSvg,
  buildStatHighlightSvg,
  buildTipCardSvg,
} from './svg-templates';

export interface TemplateRenderContext {
  profile?: GenerationContentProfileContext;
  mediaTemplateId?: string;
}

@Injectable()
export class MediaTemplateService {
  private readonly logger = new Logger(MediaTemplateService.name);

  render(
    spec: MediaCreatorOutput,
    context: TemplateRenderContext,
  ): { imageBuffer: Buffer; mimeType: string } {
    const profileName = context.profile?.name ?? 'Author';
    const roleTitle = context.profile?.roleTitle ?? undefined;
    const brandPrimary = context.profile?.brandPrimary ?? undefined;
    const brandAccent = context.profile?.brandAccent ?? undefined;
    const templateId = context.mediaTemplateId;

    let svg: string;

    if (isCatalogTemplateId(templateId)) {
      switch (templateId) {
        case 'linkedin_educational':
          svg = buildEducationalPostSvg({
            profileName,
            roleTitle,
            headlineText: spec.headlineText ?? '',
            accentPhrase: spec.accentPhrase,
            supportingLine: spec.supportingLine,
            footerTags: spec.footerTags,
            ctaFooter: spec.ctaFooter,
            flowSteps: spec.flowSteps,
            brandAccent,
          });
          break;
        case 'linkedin_quote_light':
          svg = buildBrandedQuoteCardSvg({
            profileName,
            roleTitle,
            headlineText: spec.headlineText ?? '',
            ctaFooter: spec.ctaFooter,
            brandPrimary,
            brandAccent,
            variant: 'light',
          });
          break;
        case 'linkedin_quote_dark':
          svg = buildBrandedQuoteCardSvg({
            profileName,
            roleTitle,
            headlineText: spec.headlineText ?? '',
            ctaFooter: spec.ctaFooter,
            brandPrimary,
            brandAccent,
            variant: 'dark',
          });
          break;
        case 'linkedin_tips':
          svg = buildTipCardSvg({
            profileName,
            roleTitle,
            tips: spec.tips ?? [],
            brandPrimary,
            brandAccent,
          });
          break;
        case 'linkedin_stat':
          svg = buildStatHighlightSvg({
            profileName,
            roleTitle,
            statValue: spec.statValue ?? '—',
            statLabel: spec.statLabel ?? spec.headlineText ?? '',
            brandPrimary,
            brandAccent,
          });
          break;
        default: {
          const exhaustive: never = templateId;
          throw new Error(`Unhandled catalog template: ${exhaustive}`);
        }
      }
    } else {
      svg = this.renderByMediaType(spec, {
        profileName,
        roleTitle,
        brandPrimary,
        brandAccent,
      });
    }

    try {
      const resvg = new Resvg(svg, {
        fitTo: { mode: 'width', value: 1200 },
      });
      const pngData = resvg.render();
      return {
        imageBuffer: Buffer.from(pngData.asPng()),
        mimeType: 'image/png',
      };
    } catch (error) {
      this.logger.error('Template render failed', error);
      throw error;
    }
  }

  private renderByMediaType(
    spec: MediaCreatorOutput,
    profile: {
      profileName: string;
      roleTitle?: string;
      brandPrimary?: string;
      brandAccent?: string;
    },
  ): string {
    switch (spec.mediaType) {
      case PostMediaType.branded_quote_card:
        return buildBrandedQuoteCardSvg({
          profileName: profile.profileName,
          roleTitle: profile.roleTitle,
          headlineText: spec.headlineText ?? '',
          ctaFooter: spec.ctaFooter,
          brandPrimary: profile.brandPrimary,
          brandAccent: profile.brandAccent,
          variant: 'dark',
        });
      case PostMediaType.stat_highlight:
        return buildStatHighlightSvg({
          profileName: profile.profileName,
          roleTitle: profile.roleTitle,
          statValue: spec.statValue ?? '—',
          statLabel: spec.statLabel ?? spec.headlineText ?? '',
          brandPrimary: profile.brandPrimary,
          brandAccent: profile.brandAccent,
        });
      case PostMediaType.tip_card:
        return buildTipCardSvg({
          profileName: profile.profileName,
          roleTitle: profile.roleTitle,
          tips: spec.tips ?? [],
          brandPrimary: profile.brandPrimary,
          brandAccent: profile.brandAccent,
        });
      default:
        throw new Error(`Unsupported template media type: ${spec.mediaType}`);
    }
  }
}
