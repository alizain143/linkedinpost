import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { User } from '@prisma/client';
import { ApiDataResponse } from '../../common/swagger/api-data-response.decorator';
import { WorkspaceDetailResponseDto } from '../../common/swagger/responses/workspace-detail-response.dto';
import { WorkspaceResponseDto } from '../../common/swagger/responses/workspace-response.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ClerkAuthGuard } from '../../common/guards/clerk-auth.guard';
import { CreateClientWorkspaceDto } from './dto/create-client-workspace.dto';
import { UpdateClientWorkspaceDto } from './dto/update-client-workspace.dto';
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

  @Post()
  @ApiOperation({ summary: 'Create a client workspace (Agency plan)' })
  @ApiDataResponse(WorkspaceDetailResponseDto)
  create(@CurrentUser() user: User, @Body() dto: CreateClientWorkspaceDto) {
    return this.workspacesService.createClientWorkspace(user.id, dto);
  }

  @Get(':workspaceId')
  @ApiOperation({ summary: 'Get a workspace with stats' })
  @ApiDataResponse(WorkspaceDetailResponseDto)
  getOne(@CurrentUser() user: User, @Param('workspaceId') workspaceId: string) {
    return this.workspacesService.getById(workspaceId, user.id);
  }

  @Patch(':workspaceId')
  @ApiOperation({ summary: 'Rename a client workspace' })
  @ApiDataResponse(WorkspaceDetailResponseDto)
  update(
    @CurrentUser() user: User,
    @Param('workspaceId') workspaceId: string,
    @Body() dto: UpdateClientWorkspaceDto,
  ) {
    return this.workspacesService.updateClientWorkspace(
      workspaceId,
      user.id,
      dto,
    );
  }

  @Delete(':workspaceId')
  @ApiOperation({
    summary: 'Soft-delete a client workspace and cascade to its content',
  })
  @ApiDataResponse(Object, { description: '{ deleted: true }' })
  remove(@CurrentUser() user: User, @Param('workspaceId') workspaceId: string) {
    return this.workspacesService.softDeleteClientWorkspace(
      workspaceId,
      user.id,
    );
  }
}
