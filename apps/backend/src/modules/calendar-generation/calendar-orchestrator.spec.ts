import { Test, TestingModule } from '@nestjs/testing';
import { GenerationJobStatus } from '@prisma/client';
import { createMockPrismaService } from '../../test/prisma.mock';
import { buildUser, userId, workspaceId } from '../../test/fixtures';
import { PrismaService } from '../../prisma/prisma.service';
import { CalendarOrchestrator } from './calendar-orchestrator';
import { CalendarPlannerService } from './calendar-planner.service';
import { CalendarSlotService } from './calendar-slot.service';
import { CalendarCouncilSlotService } from './calendar-council-slot.service';

describe('CalendarOrchestrator', () => {
  let orchestrator: CalendarOrchestrator;
  const prisma = createMockPrismaService();
  const calendarPlannerService = { plan: jest.fn() };
  const calendarSlotService = {
    generateVariant: jest.fn().mockResolvedValue({
      hook: 'h',
      body: 'b',
      cta: 'c',
      tags: [],
      tone: null,
      pillar: null,
    }),
  };

  const calendarCouncilSlotService = {
    generateSlot: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CalendarOrchestrator,
        { provide: PrismaService, useValue: prisma },
        { provide: CalendarPlannerService, useValue: calendarPlannerService },
        { provide: CalendarSlotService, useValue: calendarSlotService },
        {
          provide: CalendarCouncilSlotService,
          useValue: calendarCouncilSlotService,
        },
      ],
    }).compile();

    orchestrator = module.get(CalendarOrchestrator);
  });

  it('resumes from existing postPackageIds without re-planning', async () => {
    prisma.generationJob.findUniqueOrThrow.mockResolvedValue({
      id: 'job-1',
      userId,
      workspaceId,
      status: GenerationJobStatus.running,
      user: buildUser(),
      input: {
        workspaceId,
        userId,
        slotDates: ['2026-07-01', '2026-07-02'],
        contentProfileId: 'profile-1',
        postingTime: '09:00',
        durationDays: 2,
      },
      result: {
        postPackageIds: ['post-1'],
        slots: [{ topic: 'Topic 1', pillar: null }],
      },
    });
    prisma.generationJob.update.mockResolvedValue({});
    prisma.postPackage.create.mockResolvedValue({ id: 'post-2' });

    await orchestrator.run('job-1');

    expect(calendarPlannerService.plan).not.toHaveBeenCalled();
    expect(calendarSlotService.generateVariant).toHaveBeenCalledTimes(1);
  });
});
