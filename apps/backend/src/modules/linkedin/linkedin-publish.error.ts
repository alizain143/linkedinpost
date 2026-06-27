export class LinkedInPublishError extends Error {
  constructor(
    message: string,
    readonly code: string,
  ) {
    super(message);
    this.name = 'LinkedInPublishError';
  }
}
