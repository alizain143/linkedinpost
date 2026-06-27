import { ConflictException } from '@nestjs/common';
import { PostPackageStatus } from '@prisma/client';
import { assertPublishTransition } from './publish-status.transitions';

describe('assertPublishTransition', () => {
  it('allows approved to publish', () => {
    expect(() =>
      assertPublishTransition(PostPackageStatus.approved),
    ).not.toThrow();
  });

  it('allows failed publish retry when publishErrorCode exists', () => {
    expect(() =>
      assertPublishTransition(PostPackageStatus.failed, 'LINKEDIN_PUBLISH_FAILED'),
    ).not.toThrow();
  });

  it('rejects council failed retry', () => {
    expect(() =>
      assertPublishTransition(PostPackageStatus.failed, null),
    ).toThrow(ConflictException);
  });
});
