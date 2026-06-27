import { Inject, Injectable } from '@nestjs/common';
import { ContextAssembler } from '../generation/context/context-assembler';
import { CalendarInput } from '../generation/generation.types';
import { GenerationContext } from '../generation/generation.types';
import { MODEL_ROUTER } from '../generation/llm/model-capability.types';
import type { ModelRouter } from '../generation/llm/model-capability.types';
import { PromptRenderer } from '../generation/prompt-renderer';
import {
  CalendarPlannerOutput,
  CalendarPlannerOutputParser,
} from './parsers/calendar-planner-output.parser';

@Injectable()
export class CalendarPlannerService {
  constructor(
    private readonly contextAssembler: ContextAssembler,
    private readonly promptRenderer: PromptRenderer,
    @Inject(MODEL_ROUTER) private readonly modelRouter: ModelRouter,
    private readonly plannerParser: CalendarPlannerOutputParser,
  ) {}

  async plan(input: CalendarInput): Promise<CalendarPlannerOutput> {
    const baseContext = await this.contextAssembler.assemble(input);
    const context: GenerationContext = {
      ...baseContext,
      input: {
        ...baseContext.input,
        additionalContext: input.additionalContext,
        calendarSlotDates: input.slotDates,
        calendarSlotCount: input.slotDates.length,
        calendarDurationDays: input.durationDays,
      },
    };

    const messages = this.promptRenderer.renderFlow(
      'calendar-planner',
      1,
      context,
    );
    const completion = await this.modelRouter
      .text()
      .complete({ messages, responseFormat: 'json' });

    return this.plannerParser.parse(completion.content, input.slotDates);
  }
}
