import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsString, MaxLength, ValidateNested } from 'class-validator';
import { ClientWorkspaceProfileDto } from './client-workspace-profile.dto';

export class CreateClientWorkspaceDto {
  @ApiProperty({ example: 'Acme Corp', maxLength: 200 })
  @IsString()
  @MaxLength(200)
  name!: string;

  @ApiPropertyOptional({ type: ClientWorkspaceProfileDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => ClientWorkspaceProfileDto)
  profile?: ClientWorkspaceProfileDto;
}
