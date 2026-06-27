import { ForbiddenException, Injectable } from '@nestjs/common';
import {
  PlanFeature,
  planAllowsFeature,
} from '../../common/constants/plan-features.constants';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PlanFeatureService {
  constructor(private readonly prisma: PrismaService) {}

  async hasFeature(userId: string, feature: PlanFeature): Promise<boolean> {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
    });
    return planAllowsFeature(user.plan, feature);
  }

  async assertAllows(userId: string, feature: PlanFeature): Promise<void> {
    const allowed = await this.hasFeature(userId, feature);
    if (!allowed) {
      throw new ForbiddenException({
        error: 'This feature requires a plan upgrade',
        code: 'PLAN_UPGRADE_REQUIRED',
      });
    }
  }
}
