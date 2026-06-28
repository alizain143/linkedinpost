import { Global, Module, forwardRef } from '@nestjs/common';
import { UsersModule } from '../../modules/users/users.module';
import { ClerkAuthGuard } from './clerk-auth.guard';

@Global()
@Module({
  imports: [forwardRef(() => UsersModule)],
  providers: [ClerkAuthGuard],
  exports: [ClerkAuthGuard],
})
export class AuthGuardModule {}
