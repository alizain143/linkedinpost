import {
  Body,
  Controller,
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
import { ImportLinkedInProfileDto } from './dto/import-linkedin-profile.dto';
import { CreateImportTokenDto } from './dto/create-import-token.dto';
import { ExtractLinkedInProfileSnapshotDto } from './dto/extract-linkedin-profile-snapshot.dto';
import { LinkedInProfileImportService } from './linkedin-profile-import.service';
import { LinkedInProfileSnapshotExtractService } from './linkedin-profile-snapshot-extract.service';

@ApiTags('linkedin')
@Controller('workspaces/:workspaceId/linkedin')
export class LinkedInProfileImportController {
  constructor(
    private readonly profileImportService: LinkedInProfileImportService,
    private readonly snapshotExtractService: LinkedInProfileSnapshotExtractService,
  ) {}

  @Post('profile/import-token')
  @UseGuards(ClerkAuthGuard)
  @ApiBearerAuth('bearer')
  @ApiOperation({
    summary: 'Create a short-lived token for browser extension profile import',
  })
  @ApiParam({ name: 'workspaceId', format: 'uuid' })
  createImportToken(
    @CurrentUser() user: User,
    @Param('workspaceId') workspaceId: string,
    @Body() dto: CreateImportTokenDto = {},
  ) {
    return this.profileImportService.createImportToken(
      workspaceId,
      user.id,
      dto?.profileUrl,
    );
  }

  @Post('profile/import/extract')
  @ApiOperation({
    summary:
      'Extract structured profile preview from DOM snapshot (extension + importToken)',
  })
  @ApiParam({ name: 'workspaceId', format: 'uuid' })
  extractProfileFromSnapshot(
    @Param('workspaceId') workspaceId: string,
    @Body() dto: ExtractLinkedInProfileSnapshotDto,
  ) {
    return this.snapshotExtractService.extractFromSnapshot(workspaceId, dto);
  }

  @Post('profile/import')
  @ApiOperation({
    summary:
      'Import profile from browser extension using importToken (no Clerk JWT required)',
  })
  @ApiParam({ name: 'workspaceId', format: 'uuid' })
  importProfileViaToken(
    @Param('workspaceId') workspaceId: string,
    @Body() dto: ImportLinkedInProfileDto,
  ) {
    return this.profileImportService.importProfile(workspaceId, null, dto);
  }
}

@ApiTags('linkedin')
@Controller('workspaces/:workspaceId/linkedin')
@UseGuards(ClerkAuthGuard)
@ApiBearerAuth('bearer')
export class WorkspaceLinkedInImportAuthController {
  constructor(
    private readonly profileImportService: LinkedInProfileImportService,
  ) {}

  @Post('profile/import/authenticated')
  @ApiOperation({
    summary: 'Import LinkedIn profile from web app paste form (Clerk auth)',
  })
  @ApiParam({ name: 'workspaceId', format: 'uuid' })
  importProfileAuthenticated(
    @CurrentUser() user: User,
    @Param('workspaceId') workspaceId: string,
    @Body() dto: ImportLinkedInProfileDto,
  ) {
    return this.profileImportService.importProfile(workspaceId, user.id, dto);
  }
}
