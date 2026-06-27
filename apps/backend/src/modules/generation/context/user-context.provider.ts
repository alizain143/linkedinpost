import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { ContextProvider } from './context-provider.interface';
import {
  GenerationContext,
  GenerationContextSlice,
  QuickDraftInput,
} from '../generation.types';

@Injectable()
export class UserContextProvider implements ContextProvider {
  readonly order = 10;

  constructor(private readonly prisma: PrismaService) {}

  async provide(
    input: QuickDraftInput,
    _accumulated: GenerationContext,
  ): Promise<GenerationContextSlice> {
    const user = await this.prisma.user.findUnique({
      where: { id: input.userId },
    });

    if (!user) {
      return {};
    }

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        timezone: user.timezone,
        plan: user.plan,
      },
    };
  }
}
