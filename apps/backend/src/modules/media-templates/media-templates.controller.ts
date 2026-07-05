import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { MediaMode, type User } from '@prisma/client';
import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ClerkAuthGuard } from '../../common/guards/clerk-auth.guard';
import { AiCreateMediaTemplateDto } from './dto/ai-create-media-template.dto';
import { CreateMediaTemplateDto } from './dto/create-media-template.dto';
import { PreviewMediaTemplateDto } from './dto/preview-media-template.dto';
import { SetDefaultMediaTemplateDto } from './dto/set-default-media-template.dto';
import { UpdateMediaTemplateDto } from './dto/update-media-template.dto';
import { MediaTemplateAiService } from './media-template-ai.service';
import { MediaTemplatesService } from './media-templates.service';

class SetDefaultMediaModeDto {
  @ApiProperty({ enum: MediaMode })
  @IsEnum(MediaMode)
  mode!: MediaMode;
}

@ApiTags('media-templates')
@ApiBearerAuth('bearer')
@Controller('workspaces/:workspaceId/media-templates')
@UseGuards(ClerkAuthGuard)
export class MediaTemplatesController {
  constructor(
    private readonly mediaTemplatesService: MediaTemplatesService,
    private readonly mediaTemplateAiService: MediaTemplateAiService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List media templates and system presets' })
  @ApiParam({ name: 'workspaceId', format: 'uuid' })
  list(@CurrentUser() user: User, @Param('workspaceId') workspaceId: string) {
    return this.mediaTemplatesService.list(workspaceId, user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a media template' })
  @ApiParam({ name: 'workspaceId', format: 'uuid' })
  create(
    @CurrentUser() user: User,
    @Param('workspaceId') workspaceId: string,
    @Body() dto: CreateMediaTemplateDto,
  ) {
    return this.mediaTemplatesService.create(workspaceId, user.id, dto);
  }

  @Post('from-preset/:presetId')
  @ApiOperation({ summary: 'Copy a system preset into the workspace' })
  @ApiParam({ name: 'workspaceId', format: 'uuid' })
  createFromPreset(
    @CurrentUser() user: User,
    @Param('workspaceId') workspaceId: string,
    @Param('presetId') presetId: string,
  ) {
    return this.mediaTemplatesService.createFromPreset(
      workspaceId,
      user.id,
      presetId,
    );
  }

  @Post('ai-draft')
  @ApiOperation({
    summary:
      'AI-author a template layout draft from text and/or an image/PDF reference (not saved until create)',
  })
  @ApiParam({ name: 'workspaceId', format: 'uuid' })
  aiDraft(
    @CurrentUser() user: User,
    @Param('workspaceId') workspaceId: string,
    @Body() dto: AiCreateMediaTemplateDto,
  ) {
    return this.mediaTemplateAiService.draftFromInput(workspaceId, user.id, {
      prompt: dto.prompt,
      referenceFile: dto.referenceFile,
    });
  }

  @Post('preview')
  @ApiOperation({ summary: 'Preview a layout as PNG (base64)' })
  @ApiParam({ name: 'workspaceId', format: 'uuid' })
  previewLayout(
    @CurrentUser() user: User,
    @Param('workspaceId') workspaceId: string,
    @Body() dto: PreviewMediaTemplateDto,
  ) {
    return this.mediaTemplatesService.previewPng(
      workspaceId,
      user.id,
      null,
      dto,
    );
  }

  @Put('default')
  @ApiOperation({ summary: 'Set default template for workspace or profile' })
  @ApiParam({ name: 'workspaceId', format: 'uuid' })
  setDefault(
    @CurrentUser() user: User,
    @Param('workspaceId') workspaceId: string,
    @Body() dto: SetDefaultMediaTemplateDto,
  ) {
    return this.mediaTemplatesService.setDefault(workspaceId, user.id, dto);
  }

  @Put('default-mode')
  @ApiOperation({ summary: 'Set default media mode (freestyle | template)' })
  @ApiParam({ name: 'workspaceId', format: 'uuid' })
  setDefaultMode(
    @CurrentUser() user: User,
    @Param('workspaceId') workspaceId: string,
    @Body() dto: SetDefaultMediaModeDto,
  ) {
    return this.mediaTemplatesService.setDefaultMediaMode(
      workspaceId,
      user.id,
      dto.mode,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a media template' })
  @ApiParam({ name: 'workspaceId', format: 'uuid' })
  getOne(
    @CurrentUser() user: User,
    @Param('workspaceId') workspaceId: string,
    @Param('id') id: string,
  ) {
    return this.mediaTemplatesService.getOne(workspaceId, user.id, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a media template' })
  @ApiParam({ name: 'workspaceId', format: 'uuid' })
  update(
    @CurrentUser() user: User,
    @Param('workspaceId') workspaceId: string,
    @Param('id') id: string,
    @Body() dto: UpdateMediaTemplateDto,
  ) {
    return this.mediaTemplatesService.update(workspaceId, user.id, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft-delete a media template' })
  @ApiParam({ name: 'workspaceId', format: 'uuid' })
  remove(
    @CurrentUser() user: User,
    @Param('workspaceId') workspaceId: string,
    @Param('id') id: string,
  ) {
    return this.mediaTemplatesService.remove(workspaceId, user.id, id);
  }

  @Post(':id/preview')
  @ApiOperation({ summary: 'Preview a saved template as PNG (base64)' })
  @ApiParam({ name: 'workspaceId', format: 'uuid' })
  previewSaved(
    @CurrentUser() user: User,
    @Param('workspaceId') workspaceId: string,
    @Param('id') id: string,
    @Body() dto: PreviewMediaTemplateDto,
  ) {
    return this.mediaTemplatesService.previewPng(
      workspaceId,
      user.id,
      id,
      dto,
    );
  }
}
