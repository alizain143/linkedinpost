import { MediaCreatorOutputParser } from './parsers/media-creator-output.parser';
import { ReviewerOutputParser } from './parsers/reviewer-output.parser';
import { WriterOutputParser } from './parsers/writer-output.parser';
import { computeCouncilProgress, councilTotalSteps } from './council-progress';
import { assertCouncilStatusTransition } from '../posts/council-status.transitions';
import { PostPackageStatus } from '@prisma/client';
import { JobHandlerRegistry } from '../job-queue/job-handler.registry';
import { GenerationJobType } from '@prisma/client';

describe('WriterOutputParser', () => {
  const parser = new WriterOutputParser();

  it('parses valid writer JSON', () => {
    const result = parser.parse(
      JSON.stringify({
        hook: 'Hook',
        body: 'Body',
        cta: 'CTA',
        tags: ['a'],
      }),
    );

    expect(result.hook).toBe('Hook');
    expect(result.tags).toEqual(['a']);
  });
});

describe('ReviewerOutputParser', () => {
  const parser = new ReviewerOutputParser();

  it('parses reviewer scores', () => {
    const result = parser.parse(
      JSON.stringify({
        overall: 81,
        hook: 80,
        voice: 78,
        clarity: 70,
        passed: true,
        feedback: 'Good',
        revisionHints: [],
      }),
    );

    expect(result.overall).toBe(81);
    expect(result.passed).toBe(true);
  });

  it('uses custom pass score when passed is omitted', () => {
    const result = parser.parse(
      JSON.stringify({
        overall: 88,
        hook: 80,
        voice: 90,
        clarity: 85,
        feedback: 'Strong',
        revisionHints: [],
      }),
      { passScore: 90 },
    );

    expect(result.passed).toBe(false);
  });
});

describe('MediaCreatorOutputParser', () => {
  const parser = new MediaCreatorOutputParser();

  it('parses freeform media creator JSON', () => {
    const result = parser.parse(
      JSON.stringify({
        altText: 'LinkedIn post visual',
        imagePrompt: 'Navy gradient with bold white typography',
        width: 1200,
        height: 630,
        styleNotes: 'Professional',
      }),
    );

    expect(result.imagePrompt).toContain('Navy');
    expect(result.altText).toBe('LinkedIn post visual');
    expect(result.width).toBe(1200);
    expect(result.styleNotes).toBe('Professional');
  });

  it('rejects missing imagePrompt', () => {
    expect(() =>
      parser.parse(
        JSON.stringify({
          altText: 'x',
        }),
      ),
    ).toThrow();
  });
});

describe('council progress', () => {
  it('computes percent complete', () => {
    const progress = computeCouncilProgress(3, 'editor', 'Editing', 7);
    expect(progress.percentComplete).toBe(43);
  });

  it('calculates total steps with revisions', () => {
    expect(councilTotalSteps(1, 1)).toBe(9);
  });
});

describe('council status transitions', () => {
  it('allows text_generating to text_reviewing', () => {
    expect(() =>
      assertCouncilStatusTransition(
        PostPackageStatus.text_generating,
        PostPackageStatus.text_reviewing,
      ),
    ).not.toThrow();
  });
});

describe('JobHandlerRegistry', () => {
  it('registers and retrieves handlers', () => {
    const registry = new JobHandlerRegistry();
    const handler = {
      type: GenerationJobType.council,
      handle: jest.fn(),
    };

    registry.register(handler);
    expect(registry.get(GenerationJobType.council)).toBe(handler);
  });

  it('registers calendar handler type', () => {
    const registry = new JobHandlerRegistry();
    const handler = {
      type: GenerationJobType.calendar,
      handle: jest.fn(),
    };

    registry.register(handler);
    expect(registry.get(GenerationJobType.calendar)).toBe(handler);
  });
});
