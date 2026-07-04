import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
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
import { CreditsCost } from '../credits/credits.decorator';
import { CreditsGuard } from '../credits/credits.guard';
import { GenerationJobResponseDto } from '../../common/swagger/responses/generation-job-response.dto';
import { ApplyChangesRequestDto } from '../generation/dto/apply-changes-request.dto';
import { GenerateMediaRequestDto } from '../generation/dto/generate-media-request.dto';
import { ReviseDraftJobService } from '../generation/revise-draft-job.service';
import { MediaJobService } from '../media-generation/media-job.service';
import {
  RejectPostDto,
  RequestChangesDto,
} from '../approvals/dto/request-changes.dto';
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
  constructor(
    private readonly postsService: PostsService,
    private readonly mediaJobService: MediaJobService,
    private readonly reviseDraftJobService: ReviseDraftJobService,
  ) {}

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

  @Post(':id/approve')
  @ApiOperation({ summary: 'Approve a post awaiting review' })
  @ApiParam({ name: 'workspaceId', format: 'uuid' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiDataResponse(PostPackageResponseDto)
  approve(
    @CurrentUser() user: User,
    @Param('workspaceId') workspaceId: string,
    @Param('id') id: string,
  ) {
    return this.postsService.approvePost(workspaceId, id, user.id);
  }

  @Post(':id/request-changes')
  @ApiOperation({ summary: 'Send a post back for changes with feedback' })
  @ApiParam({ name: 'workspaceId', format: 'uuid' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiDataResponse(PostPackageResponseDto)
  requestChanges(
    @CurrentUser() user: User,
    @Param('workspaceId') workspaceId: string,
    @Param('id') id: string,
    @Body() dto: RequestChangesDto,
  ) {
    return this.postsService.requestChangesPost(
      workspaceId,
      id,
      user.id,
      dto.feedback,
    );
  }

  @Post(':id/reject')
  @ApiOperation({ summary: 'Reject a post and return it to draft' })
  @ApiParam({ name: 'workspaceId', format: 'uuid' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiDataResponse(PostPackageResponseDto)
  reject(
    @CurrentUser() user: User,
    @Param('workspaceId') workspaceId: string,
    @Param('id') id: string,
    @Body() dto: RejectPostDto,
  ) {
    return this.postsService.rejectPost(workspaceId, id, user.id, dto.feedback);
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

  @Post(':id/apply-changes')
  @UseGuards(CreditsGuard)
  @CreditsCost(1)
  @ApiOperation({
    summary: 'Apply approval feedback or regenerate post text with AI (1 credit)',
  })
  @ApiParam({ name: 'workspaceId', format: 'uuid' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiDataResponse(GenerationJobResponseDto, { status: 201 })
  applyChanges(
    @CurrentUser() user: User,
    @Param('workspaceId') workspaceId: string,
    @Param('id') id: string,
    @Body() dto: ApplyChangesRequestDto,
  ) {
    return this.reviseDraftJobService.applyChanges(
      workspaceId,
      user.id,
      id,
      dto,
    );
  }

  @Post(':id/generate-media')
  @HttpCode(HttpStatus.ACCEPTED)
  @UseGuards(CreditsGuard)
  @CreditsCost(1)
  @ApiOperation({
    summary:
      'Generate or replace media image for a post (async; 1 credit template / 2 freestyle)',
  })
  @ApiParam({ name: 'workspaceId', format: 'uuid' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiDataResponse(GenerationJobResponseDto, { status: 202 })
  generateMedia(
    @CurrentUser() user: User,
    @Param('workspaceId') workspaceId: string,
    @Param('id') id: string,
    @Body() dto: GenerateMediaRequestDto,
  ) {
    return this.mediaJobService.enqueueMedia(workspaceId, user.id, id, dto);
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
