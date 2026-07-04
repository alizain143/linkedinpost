import { CouncilAgentRole } from '@prisma/client';
import { CouncilPriorStep } from '../generation.types';

function findLatest(
  steps: CouncilPriorStep[],
  role: CouncilAgentRole,
): CouncilPriorStep | undefined {
  for (let index = steps.length - 1; index >= 0; index -= 1) {
    if (steps[index].agentRole === role) {
      return steps[index];
    }
  }

  return undefined;
}

export function projectPriorSteps(
  role: CouncilAgentRole,
  steps: CouncilPriorStep[],
): CouncilPriorStep[] {
  switch (role) {
    case CouncilAgentRole.writer: {
      const reviewer = findLatest(steps, CouncilAgentRole.reviewer);
      if (!reviewer) {
        return [];
      }

      return [
        {
          agentRole: CouncilAgentRole.reviewer,
          revisionAttempt: reviewer.revisionAttempt,
          output: {
            feedback: reviewer.output.feedback,
            revisionHints: reviewer.output.revisionHints,
            overall: reviewer.output.overall,
            hook: reviewer.output.hook,
            voice: reviewer.output.voice,
            clarity: reviewer.output.clarity,
          },
        },
      ];
    }
    case CouncilAgentRole.reviewer: {
      const writer = findLatest(steps, CouncilAgentRole.writer);
      if (!writer) {
        return [];
      }

      return [
        {
          agentRole: CouncilAgentRole.writer,
          revisionAttempt: writer.revisionAttempt,
          output: {
            hook: writer.output.hook,
            body: writer.output.body,
            cta: writer.output.cta,
            tags: writer.output.tags,
          },
        },
      ];
    }
    case CouncilAgentRole.editor: {
      const writer = findLatest(steps, CouncilAgentRole.writer);
      const reviewer = findLatest(steps, CouncilAgentRole.reviewer);
      const projected: CouncilPriorStep[] = [];

      if (writer) {
        projected.push({
          agentRole: CouncilAgentRole.writer,
          revisionAttempt: writer.revisionAttempt,
          output: {
            hook: writer.output.hook,
            body: writer.output.body,
            cta: writer.output.cta,
            tags: writer.output.tags,
          },
        });
      }

      if (reviewer) {
        projected.push({
          agentRole: CouncilAgentRole.reviewer,
          revisionAttempt: reviewer.revisionAttempt,
          output: {
            overall: reviewer.output.overall,
            hook: reviewer.output.hook,
            voice: reviewer.output.voice,
            clarity: reviewer.output.clarity,
          },
          scores: reviewer.scores,
        });
      }

      return projected;
    }
    case CouncilAgentRole.media_creator: {
      const editor = findLatest(steps, CouncilAgentRole.editor);
      if (!editor) {
        return [];
      }

      const output: Record<string, unknown> = {
        hook: editor.output.hook,
        body: editor.output.body,
        cta: editor.output.cta,
        tags: editor.output.tags,
      };

      if (typeof editor.output.changelog === 'string') {
        output.changelog = editor.output.changelog;
      }

      return [
        {
          agentRole: CouncilAgentRole.editor,
          revisionAttempt: editor.revisionAttempt,
          output,
        },
      ];
    }
    case CouncilAgentRole.image_scout: {
      const editor = findLatest(steps, CouncilAgentRole.editor);
      if (!editor) {
        return [];
      }

      return [
        {
          agentRole: CouncilAgentRole.editor,
          revisionAttempt: editor.revisionAttempt,
          output: {
            hook: editor.output.hook,
            body: editor.output.body,
            cta: editor.output.cta,
            tags: editor.output.tags,
          },
        },
      ];
    }
    case CouncilAgentRole.media_reviewer: {
      const mediaCreator = findLatest(steps, CouncilAgentRole.media_creator);
      if (!mediaCreator) {
        return [];
      }

      const {
        generated: _generated,
        imageModel: _imageModel,
        postMediaId: _postMediaId,
        url: _url,
        ...spec
      } = mediaCreator.output;

      return [
        {
          agentRole: CouncilAgentRole.media_creator,
          revisionAttempt: mediaCreator.revisionAttempt,
          output: spec,
        },
      ];
    }
    default:
      return steps;
  }
}

export function serializePriorSteps(steps: CouncilPriorStep[]): string {
  return JSON.stringify(steps);
}
