import {
  Body,
  Controller,
  Get,
  Param,
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
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ClerkAuthGuard } from '../../common/guards/clerk-auth.guard';
import { WorkspacesService } from '../workspaces/workspaces.service';
import { SubmitMediaReferencesDto } from './dto/submit-media-references.dto';
import { GenerationMediaReferencesService } from './generation-media-references.service';

@ApiTags('generation')
@ApiBearerAuth('bearer')
@Controller('workspaces/:workspaceId/jobs')
@UseGuards(ClerkAuthGuard)
export class GenerationMediaReferencesController {
  constructor(
    private readonly mediaReferencesService: GenerationMediaReferencesService,
    private readonly workspacesService: WorkspacesService,
  ) {}

  @Get(':id/media-references')
  @ApiOperation({ summary: 'List image reference candidates for a paused council job' })
  @ApiParam({ name: 'workspaceId', format: 'uuid' })
  @ApiParam({ name: 'id', format: 'uuid' })
  async getMediaReferences(
    @CurrentUser() user: User,
    @Param('workspaceId') workspaceId: string,
    @Param('id') jobId: string,
  ) {
    await this.workspacesService.assertMember(user.id, workspaceId);
    const candidates = await this.mediaReferencesService.getMediaReferences(
      workspaceId,
      user.id,
      jobId,
    );
    return { candidates };
  }

  @Post(':id/media-references')
  @ApiOperation({ summary: 'Submit selected references and resume council media phase' })
  @ApiParam({ name: 'workspaceId', format: 'uuid' })
  @ApiParam({ name: 'id', format: 'uuid' })
  async submitMediaReferences(
    @CurrentUser() user: User,
    @Param('workspaceId') workspaceId: string,
    @Param('id') jobId: string,
    @Body() dto: SubmitMediaReferencesDto,
  ) {
    await this.workspacesService.assertMember(user.id, workspaceId);
    return this.mediaReferencesService.submitMediaReferences(
      workspaceId,
      user.id,
      jobId,
      dto,
    );
  }
}
