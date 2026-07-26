import { Module, forwardRef } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CreditsController } from './credits.controller';
import { CreditsGuard } from './credits.guard';
import { CreditsService } from './credits.service';

@Module({
  imports: [forwardRef(() => AuthModule)],
  controllers: [CreditsController],
  providers: [CreditsService, CreditsGuard],
  exports: [CreditsService, CreditsGuard],
})
export class CreditsModule {}
