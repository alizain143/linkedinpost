import { Injectable } from '@nestjs/common';
import { CouncilAgentRole } from '@prisma/client';
import { GenerationContext, LlmMessage } from './generation.types';
import {
  projectPriorSteps,
  serializePriorSteps,
} from './prompts/prior-steps-projector';
import {
  PROMPT_FIELD_LIMITS,
  truncateText,
} from './prompts/prompt-text.util';
import { getPromptTemplate } from './prompts/prompt-registry';
import {
  buildBriefBlock,
  buildMediaProfileBlock,
  buildMinimalProfileBlock,
  buildPostBlock,
  buildProfileBlock,
  buildRequestBlock,
  buildRevisionBlock,
} from './prompts/shared-profile-block';

export interface RenderFlowOptions {
  agentRole?: CouncilAgentRole;
  passScore?: number;
}

@Injectable()
export class PromptRenderer {
  renderQuickDraftV1(context: GenerationContext): LlmMessage[] {
    return this.renderFlow('quick-draft', 1, context);
  }

  renderQuickDraftSingleV1(context: GenerationContext): LlmMessage[] {
    return this.renderFlow('quick-draft-single', 1, context);
  }

  renderReviseDraftV1(context: GenerationContext): LlmMessage[] {
    return this.renderFlow('revise-draft', 1, context);
  }

  renderComparePickV1(
    context: GenerationContext,
    optionsBlock: string,
  ): LlmMessage[] {
    const template = getPromptTemplate('compare-pick', 1);
    const values = {
      ...this.buildPlaceholderValues(context),
      'compare.options': optionsBlock,
    };

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

  renderFlow(
    flowId: string,
    version: number,
    context: GenerationContext,
    options?: RenderFlowOptions,
  ): LlmMessage[] {
    const template = getPromptTemplate(flowId, version);
    const agentRole = options?.agentRole ?? context.promptAgentRole;
    const values = this.buildPlaceholderValues(context, agentRole, options?.passScore);

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
    agentRole?: CouncilAgentRole,
    passScore?: number,
  ): Record<string, string> {
    const user = context.user;
    const profile = context.contentProfile;
    const input = context.input;
    const documents = context.documents ?? [];

    const displayName = [user?.firstName, user?.lastName]
      .filter(Boolean)
      .join(' ')
      .trim();

    const writingSample = truncateText(
      profile?.writingSample ?? '',
      PROMPT_FIELD_LIMITS.writingSample,
    );
    const avoidWords = truncateText(
      profile?.avoidWords ?? '',
      PROMPT_FIELD_LIMITS.avoidWords,
    );
    const offerDescription = truncateText(
      profile?.offerDescription ?? '',
      PROMPT_FIELD_LIMITS.offerDescription,
    );
    const additionalContext = truncateText(
      input?.additionalContext ?? '',
      PROMPT_FIELD_LIMITS.additionalContext,
    );
    const brief = truncateText(input?.brief ?? '', PROMPT_FIELD_LIMITS.brief);
    const pillars =
      profile?.pillars?.slice(0, PROMPT_FIELD_LIMITS.maxPillars).join(', ') ??
      '';

    const profileFields = {
      name: profile?.name ?? '',
      roleTitle: profile?.roleTitle ?? '',
      industry: profile?.industry ?? '',
      targetAudience: profile?.targetAudience ?? '',
      contentGoal: profile?.contentGoal ?? '',
      preferredTone: profile?.preferredTone ?? '',
      offerDescription,
      writingSample,
      avoidWords,
      pillars,
    };

    const priorSteps = agentRole
      ? projectPriorSteps(agentRole, context.priorSteps ?? [])
      : (context.priorSteps ?? []);

    const priorStepsJson = serializePriorSteps(priorSteps);
    const priorFeedbackBlock =
      agentRole === CouncilAgentRole.writer && priorSteps.length > 0
        ? `<prior_feedback>\n${priorStepsJson}\n</prior_feedback>`
        : '';

    const editorStep = priorSteps.find(
      (step) => step.agentRole === CouncilAgentRole.editor,
    );
    const postBody = truncateText(
      String(editorStep?.output.body ?? ''),
      PROMPT_FIELD_LIMITS.postBodyPreview,
    );

    const documentsLine =
      documents.length > 0
        ? `documents: ${documents.map((doc) => doc.filename).join(', ')}`
        : '';

    const slotDates = input?.calendarSlotDates ?? [];

    return {
      'user.displayName': displayName || user?.email || '',
      'user.timezone': user?.timezone ?? '',
      'user.plan': user?.plan ?? '',
      'contentProfile.name': profileFields.name,
      'contentProfile.roleTitle': profileFields.roleTitle,
      'contentProfile.industry': profileFields.industry,
      'contentProfile.targetAudience': profileFields.targetAudience,
      'contentProfile.contentGoal': profileFields.contentGoal,
      'contentProfile.preferredTone': profileFields.preferredTone,
      'contentProfile.offerDescription': offerDescription,
      'contentProfile.writingSample': writingSample,
      'contentProfile.avoidWords': avoidWords,
      'contentProfile.pillars': pillars,
      'input.topic': input?.topic ?? '',
      'input.postType': input?.postType ?? '',
      'input.tone': input?.tone ?? '',
      'input.pillar': input?.pillar ?? '',
      'input.additionalContext': additionalContext,
      'input.brief': brief,
      'input.mediaCustomPrompt': input?.mediaCustomPrompt ?? '',
      'calendar.slotCount': String(input?.calendarSlotCount ?? ''),
      'calendar.durationDays': String(input?.calendarDurationDays ?? ''),
      'calendar.slots.json': JSON.stringify(
        slotDates.map((date) => ({ date })),
        null,
        2,
      ),
      'calendar.slots.compact': slotDates.join(','),
      'documents.summary':
        documents.length > 0
          ? documents.map((doc) => doc.filename).join(', ')
          : 'None',
      'documents.line': documentsLine,
      'priorSteps.json': priorStepsJson,
      'priorFeedback.block': priorFeedbackBlock,
      'profile.block': buildProfileBlock(profileFields),
      'profile.minimal': buildMinimalProfileBlock({
        name: profileFields.name,
        writingSample,
        avoidWords,
      }),
      'profile.media': buildMediaProfileBlock({
        name: profileFields.name,
        roleTitle: profileFields.roleTitle,
        industry: profileFields.industry,
        preferredTone: profileFields.preferredTone,
        brandPrimary: profile?.brandPrimary ?? '',
        brandAccent: profile?.brandAccent ?? '',
        avoidWords,
      }),
      'brief.block': buildBriefBlock({
        topic: input?.topic ?? '',
        postType: input?.postType ?? '',
        tone: input?.tone ?? '',
        pillar: input?.pillar ?? '',
        brief,
        additionalContext,
      }),
      'request.block': buildRequestBlock({
        topic: input?.topic ?? '',
        postType: input?.postType ?? '',
        tone: input?.tone ?? '',
        pillar: input?.pillar ?? '',
        additionalContext,
        documentsLine,
      }),
      'revision.block': buildRevisionBlock({
        previousHook: input?.previousHook,
        previousBody: input?.previousBody,
        previousCta: input?.previousCta,
        previousTags: input?.previousTags,
        revisionPrompt: input?.revisionPrompt,
        approvalFeedback: input?.approvalFeedback,
      }),
      'post.block': buildPostBlock({
        hook: String(editorStep?.output.hook ?? ''),
        body: postBody,
        cta: String(editorStep?.output.cta ?? ''),
      }),
      'council.passScore': String(
        passScore ?? context.councilPassScore ?? 75,
      ),
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
