import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { User } from '@prisma/client';
import { ApiDataResponse } from '../../common/swagger/api-data-response.decorator';
import { CreditsBalanceResponseDto } from '../../common/swagger/responses/credits-response.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ClerkAuthGuard } from '../../common/guards/clerk-auth.guard';
import { CreditsService } from './credits.service';

@ApiTags('credits')
@ApiBearerAuth('bearer')
@Controller('credits')
@UseGuards(ClerkAuthGuard)
export class CreditsController {
  constructor(private readonly creditsService: CreditsService) {}

  @Get()
  @ApiOperation({
    summary:
      'Get current user credit balance (Stripe billing period for paid users, UTC month for free)',
  })
  @ApiDataResponse(CreditsBalanceResponseDto)
  getBalance(@CurrentUser() user: User) {
    return this.creditsService.getBalance(user.id);
  }
}
