export class CouncilPausedError extends Error {
  readonly pauseReason = 'awaiting_media_selection' as const;

  constructor(message = 'Council paused for media reference selection') {
    super(message);
    this.name = 'CouncilPausedError';
  }
}
