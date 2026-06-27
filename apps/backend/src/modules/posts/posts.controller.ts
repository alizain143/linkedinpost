import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
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
  DeletePostResponseDto,
  PostPackageResponseDto,
  PostVersionResponseDto,
} from '../../common/swagger/responses/post-response.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ClerkAuthGuard } from '../../common/guards/clerk-auth.guard';
import { CreatePostDto } from './dto/create-post.dto';
import { ListPostsQueryDto } from './dto/list-posts-query.dto';
import { TransitionPostStatusDto } from './dto/transition-post-status.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { PostsService } from './posts.service';

@ApiTags('posts')
@ApiBearerAuth('bearer')
@Controller('workspaces/:workspaceId/posts')
@UseGuards(ClerkAuthGuard)
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Get()
  @ApiOperation({ summary: 'List posts in a workspace' })
  @ApiParam({ name: 'workspaceId', format: 'uuid' })
  @ApiDataResponse(PostPackageResponseDto, { isArray: true })
  list(
    @CurrentUser() user: User,
    @Param('workspaceId') workspaceId: string,
    @Query() query: ListPostsQueryDto,
  ) {
    return this.postsService.list(workspaceId, user.id, query);
  }

  @Post()
  @ApiOperation({ summary: 'Create a draft post' })
  @ApiParam({ name: 'workspaceId', format: 'uuid' })
  @ApiDataResponse(PostPackageResponseDto, { status: 201 })
  create(
    @CurrentUser() user: User,
    @Param('workspaceId') workspaceId: string,
    @Body() dto: CreatePostDto,
  ) {
    return this.postsService.create(workspaceId, user.id, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a post by ID' })
  @ApiParam({ name: 'workspaceId', format: 'uuid' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiDataResponse(PostPackageResponseDto)
  getOne(
    @CurrentUser() user: User,
    @Param('workspaceId') workspaceId: string,
    @Param('id') id: string,
  ) {
    return this.postsService.getOne(workspaceId, id, user.id);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Transition a post to a new workflow status' })
  @ApiParam({ name: 'workspaceId', format: 'uuid' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiDataResponse(PostPackageResponseDto)
  transitionStatus(
    @CurrentUser() user: User,
    @Param('workspaceId') workspaceId: string,
    @Param('id') id: string,
    @Body() dto: TransitionPostStatusDto,
  ) {
    return this.postsService.transitionStatus(workspaceId, id, user.id, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a draft post' })
  @ApiParam({ name: 'workspaceId', format: 'uuid' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiDataResponse(PostPackageResponseDto)
  update(
    @CurrentUser() user: User,
    @Param('workspaceId') workspaceId: string,
    @Param('id') id: string,
    @Body() dto: UpdatePostDto,
  ) {
    return this.postsService.update(workspaceId, id, user.id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a draft post' })
  @ApiParam({ name: 'workspaceId', format: 'uuid' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiDataResponse(DeletePostResponseDto)
  remove(
    @CurrentUser() user: User,
    @Param('workspaceId') workspaceId: string,
    @Param('id') id: string,
  ) {
    return this.postsService.remove(workspaceId, id, user.id);
  }

  @Get(':id/versions')
  @ApiOperation({ summary: 'List version history for a post' })
  @ApiParam({ name: 'workspaceId', format: 'uuid' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiDataResponse(PostVersionResponseDto, { isArray: true })
  listVersions(
    @CurrentUser() user: User,
    @Param('workspaceId') workspaceId: string,
    @Param('id') id: string,
  ) {
    return this.postsService.listVersions(workspaceId, id, user.id);
  }
}
