import { ApiPropertyOptional } from '@nestjs/swagger';
import { ChangesApplyMode } from '@prisma/client';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateWorkspaceSettingsDto {
  @ApiPropertyOptional({ example: 'My Workspace', maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  name?: string;

  @ApiPropertyOptional({
    enum: ChangesApplyMode,
    description:
      'review_first: user reviews feedback then applies AI. auto_apply: AI revises immediately when changes are requested.',
  })
  @IsOptional()
  @IsEnum(ChangesApplyMode)
  changesApplyMode?: ChangesApplyMode;
}
