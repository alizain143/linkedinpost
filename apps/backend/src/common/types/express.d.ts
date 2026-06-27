import type { User } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      auth?: { userId: string; sessionId?: string };
      user?: User;
    }
  }
}

export {};
