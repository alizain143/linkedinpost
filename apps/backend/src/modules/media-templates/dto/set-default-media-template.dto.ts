import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsUUID } from 'class-validator';

export class SetDefaultMediaTemplateDto {
  @ApiProperty({ enum: ['workspace', 'content_profile'] })
  @IsIn(['workspace', 'content_profile'])
  scope!: 'workspace' | 'content_profile';

  @ApiPropertyOptional({
    description: 'Required when scope is content_profile',
  })
  @IsOptional()
  @IsUUID()
  contentProfileId?: string;

  @ApiPropertyOptional({
    description: 'Null clears the default for this scope',
    nullable: true,
  })
  @IsOptional()
  @IsUUID()
  templateId?: string | null;
}
