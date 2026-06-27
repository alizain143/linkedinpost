import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { User } from '@prisma/client';
import { ApiDataResponse } from '../../common/swagger/api-data-response.decorator';
import { WorkspaceResponseDto } from '../../common/swagger/responses/workspace-response.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ClerkAuthGuard } from '../../common/guards/clerk-auth.guard';
import { WorkspacesService } from './workspaces.service';

@ApiTags('workspaces')
@ApiBearerAuth('bearer')
@Controller('workspaces')
@UseGuards(ClerkAuthGuard)
export class WorkspacesController {
  constructor(private readonly workspacesService: WorkspacesService) {}

  @Get()
  @ApiOperation({ summary: 'List workspaces for the current user' })
  @ApiDataResponse(WorkspaceResponseDto, { isArray: true })
  list(@CurrentUser() user: User) {
    return this.workspacesService.findForUser(user.id);
  }

  @Get('current')
  @ApiOperation({ summary: 'Get the personal/default workspace' })
  @ApiDataResponse(WorkspaceResponseDto)
  current(@CurrentUser() user: User) {
    return this.workspacesService.getCurrentWorkspace(user.id);
  }
}
