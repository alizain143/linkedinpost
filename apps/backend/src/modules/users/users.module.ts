import { Module, forwardRef } from '@nestjs/common';
import { UsersService } from './users.service';
import { DocumentsModule } from '../documents/documents.module';
import { WorkspacesModule } from '../workspaces/workspaces.module';

@Module({
  imports: [
    forwardRef(() => DocumentsModule),
    forwardRef(() => WorkspacesModule),
  ],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
