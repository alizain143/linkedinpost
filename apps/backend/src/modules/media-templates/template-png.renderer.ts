import { Injectable, Logger } from '@nestjs/common';
import { Resvg } from '@resvg/resvg-js';
import {
  MediaTemplateLayout,
  TemplateBindContext,
} from './layout.types';
import { renderTemplateSvg } from './template-svg.renderer';

@Injectable()
export class TemplatePngRenderer {
  private readonly logger = new Logger(TemplatePngRenderer.name);

  async renderPng(
    layout: MediaTemplateLayout,
    width: number,
    height: number,
    ctx: TemplateBindContext,
  ): Promise<Buffer> {
    const bindCtx = await this.embedAvatar(ctx);
    const svg = renderTemplateSvg(layout, width, height, bindCtx);

    try {
      const resvg = new Resvg(svg, {
        fitTo: { mode: 'width', value: width },
        font: {
          loadSystemFonts: true,
          // Liberation Sans ships in the prod Docker image (Arial-compatible).
          defaultFontFamily: 'Liberation Sans',
        },
      });
      return Buffer.from(resvg.render().asPng());
    } catch (err) {
      this.logger.error('Resvg render failed', err);
      throw err;
    }
  }

  private async embedAvatar(
    ctx: TemplateBindContext,
  ): Promise<TemplateBindContext> {
    const url = ctx.avatarUrl?.trim();
    if (!url || url.startsWith('data:')) {
      return ctx;
    }

    try {
      const response = await fetch(url);
      if (!response.ok) {
        return { ...ctx, avatarUrl: null };
      }
      const contentType = response.headers.get('content-type') ?? 'image/png';
      const buffer = Buffer.from(await response.arrayBuffer());
      const dataUrl = `data:${contentType};base64,${buffer.toString('base64')}`;
      return { ...ctx, avatarUrl: dataUrl };
    } catch {
      return { ...ctx, avatarUrl: null };
    }
  }
}
