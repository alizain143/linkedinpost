import { Injectable } from '@nestjs/common';
import { getPromptTemplate } from './prompts/prompt-registry';
import {
  GenerationContext,
  LlmMessage,
} from './generation.types';

@Injectable()
export class PromptRenderer {
  renderQuickDraftV1(context: GenerationContext): LlmMessage[] {
    return this.renderFlow('quick-draft', 1, context);
  }

  renderFlow(
    flowId: string,
    version: number,
    context: GenerationContext,
  ): LlmMessage[] {
    const template = getPromptTemplate(flowId, version);
    const values = this.buildPlaceholderValues(context);

    return [
      {
        role: 'system',
        content: this.renderTemplate(template.system, values),
      },
      {
        role: 'user',
        content: this.renderTemplate(template.user, values),
      },
    ];
  }

  private buildPlaceholderValues(
    context: GenerationContext,
  ): Record<string, string> {
    const user = context.user;
    const profile = context.contentProfile;
    const input = context.input;
    const documents = context.documents ?? [];

    const displayName = [user?.firstName, user?.lastName]
      .filter(Boolean)
      .join(' ')
      .trim();

    return {
      'user.displayName': displayName || user?.email || '',
      'user.timezone': user?.timezone ?? '',
      'user.plan': user?.plan ?? '',
      'contentProfile.name': profile?.name ?? '',
      'contentProfile.roleTitle': profile?.roleTitle ?? '',
      'contentProfile.industry': profile?.industry ?? '',
      'contentProfile.targetAudience': profile?.targetAudience ?? '',
      'contentProfile.contentGoal': profile?.contentGoal ?? '',
      'contentProfile.preferredTone': profile?.preferredTone ?? '',
      'contentProfile.offerDescription': profile?.offerDescription ?? '',
      'contentProfile.writingSample': profile?.writingSample ?? '',
      'contentProfile.avoidWords': profile?.avoidWords ?? '',
      'contentProfile.pillars': profile?.pillars?.join(', ') ?? '',
      'input.topic': input?.topic ?? '',
      'input.postType': input?.postType ?? '',
      'input.tone': input?.tone ?? '',
      'input.pillar': input?.pillar ?? '',
      'input.additionalContext': input?.additionalContext ?? '',
      'input.brief': input?.brief ?? '',
      'calendar.slotCount': String(input?.calendarSlotCount ?? ''),
      'calendar.durationDays': String(input?.calendarDurationDays ?? ''),
      'calendar.slots.json': JSON.stringify(
        (input?.calendarSlotDates ?? []).map((date) => ({ date })),
        null,
        2,
      ),
      'documents.summary':
        documents.length > 0
          ? documents.map((doc) => doc.filename).join(', ')
          : 'None',
      'priorSteps.json': JSON.stringify(context.priorSteps ?? [], null, 2),
    };
  }

  private renderTemplate(
    template: string,
    values: Record<string, string>,
  ): string {
    return template.replace(
      /\{\{([^}]+)\}\}/g,
      (_match, key: string) => values[key.trim()] ?? '',
    );
  }
}
