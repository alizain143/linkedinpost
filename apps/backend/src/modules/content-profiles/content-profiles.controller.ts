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
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import type { User } from '@prisma/client';
import { ApiDataResponse } from '../../common/swagger/api-data-response.decorator';
import {
  ContentProfileResponseDto,
  DeleteContentProfileResponseDto,
} from '../../common/swagger/responses/content-profile-response.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ClerkAuthGuard } from '../../common/guards/clerk-auth.guard';
import { ContentProfilesService } from './content-profiles.service';
import { CreateContentProfileDto } from './dto/create-content-profile.dto';
import { UpdateContentProfileDto } from './dto/update-content-profile.dto';

@ApiTags('content-profiles')
@ApiBearerAuth('bearer')
@Controller('workspaces/:workspaceId/content-profiles')
@UseGuards(ClerkAuthGuard)
export class ContentProfilesController {
  constructor(
    private readonly contentProfilesService: ContentProfilesService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List content profiles in a workspace' })
  @ApiParam({ name: 'workspaceId', format: 'uuid' })
  @ApiDataResponse(ContentProfileResponseDto, { isArray: true })
  list(
    @CurrentUser() user: User,
    @Param('workspaceId') workspaceId: string,
  ) {
    return this.contentProfilesService.list(workspaceId, user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a content profile' })
  @ApiParam({ name: 'workspaceId', format: 'uuid' })
  @ApiDataResponse(ContentProfileResponseDto, { status: 201 })
  create(
    @CurrentUser() user: User,
    @Param('workspaceId') workspaceId: string,
    @Body() dto: CreateContentProfileDto,
  ) {
    return this.contentProfilesService.create(workspaceId, user.id, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a content profile by ID' })
  @ApiParam({ name: 'workspaceId', format: 'uuid' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiDataResponse(ContentProfileResponseDto)
  getOne(
    @CurrentUser() user: User,
    @Param('workspaceId') workspaceId: string,
    @Param('id') id: string,
  ) {
    return this.contentProfilesService.getOne(workspaceId, id, user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a content profile' })
  @ApiParam({ name: 'workspaceId', format: 'uuid' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiDataResponse(ContentProfileResponseDto)
  update(
    @CurrentUser() user: User,
    @Param('workspaceId') workspaceId: string,
    @Param('id') id: string,
    @Body() dto: UpdateContentProfileDto,
  ) {
    return this.contentProfilesService.update(workspaceId, id, user.id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a content profile' })
  @ApiParam({ name: 'workspaceId', format: 'uuid' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiDataResponse(DeleteContentProfileResponseDto)
  remove(
    @CurrentUser() user: User,
    @Param('workspaceId') workspaceId: string,
    @Param('id') id: string,
  ) {
    return this.contentProfilesService.remove(workspaceId, id, user.id);
  }
}
