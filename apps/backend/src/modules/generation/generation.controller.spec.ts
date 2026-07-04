import { CanActivate } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ClerkAuthGuard } from '../../common/guards/clerk-auth.guard';
import { userId, workspaceId } from '../../test/fixtures';
import { CreditsGuard } from '../credits/credits.guard';
import { QuickDraftJobService } from './quick-draft-job.service';
import { TopicSuggestionsService } from './topic-suggestions.service';
import { GenerationController } from './generation.controller';
import { CouncilJobService } from '../council/council-job.service';
import { CalendarJobService } from '../calendar-generation/calendar-job.service';

class AllowGuard implements CanActivate {
  canActivate() {
    return true;
  }
}

describe('GenerationController', () => {
  let controller: GenerationController;
  const quickDraftJobService = { runQuickDraft: jest.fn() };
  const councilJobService = { enqueueCouncil: jest.fn() };
  const calendarJobService = { enqueueCalendar: jest.fn() };
  const topicSuggestionsService = { suggestTopics: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [GenerationController],
      providers: [
        { provide: QuickDraftJobService, useValue: quickDraftJobService },
        { provide: CouncilJobService, useValue: councilJobService },
        { provide: CalendarJobService, useValue: calendarJobService },
        { provide: TopicSuggestionsService, useValue: topicSuggestionsService },
      ],
    })
      .overrideGuard(ClerkAuthGuard)
      .useClass(AllowGuard)
      .overrideGuard(CreditsGuard)
      .useClass(AllowGuard)
      .compile();

    controller = module.get(GenerationController);
  });

  it('delegates quick draft to service', async () => {
    quickDraftJobService.runQuickDraft.mockResolvedValue({ id: 'job-1' });

    const result = await controller.quickDraft(
      { id: userId } as never,
      workspaceId,
      { topic: 'Shipping weekly' },
    );

    expect(quickDraftJobService.runQuickDraft).toHaveBeenCalledWith(
      workspaceId,
      userId,
      { topic: 'Shipping weekly' },
    );
    expect(result).toEqual({ id: 'job-1' });
  });

  it('delegates council to service', async () => {
    councilJobService.enqueueCouncil.mockResolvedValue({
      id: 'job-council',
      type: 'council',
    });

    const result = await controller.council(
      { id: userId } as never,
      workspaceId,
      { topic: 'Council topic' },
    );

    expect(councilJobService.enqueueCouncil).toHaveBeenCalledWith(
      workspaceId,
      userId,
      { topic: 'Council topic' },
    );
    expect(result).toEqual({ id: 'job-council', type: 'council' });
  });

  it('delegates calendar to service', async () => {
    calendarJobService.enqueueCalendar.mockResolvedValue({
      id: 'job-calendar',
      type: 'calendar',
    });

    const result = await controller.calendar(
      { id: userId } as never,
      workspaceId,
      { durationDays: 7 },
    );

    expect(calendarJobService.enqueueCalendar).toHaveBeenCalledWith(
      workspaceId,
      userId,
      { durationDays: 7 },
    );
    expect(result).toEqual({ id: 'job-calendar', type: 'calendar' });
  });
});
