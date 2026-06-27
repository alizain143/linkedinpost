import { Module, forwardRef } from '@nestjs/common';
import { UsersService } from './users.service';
import { DocumentsModule } from '../documents/documents.module';

@Module({
  imports: [forwardRef(() => DocumentsModule)],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
