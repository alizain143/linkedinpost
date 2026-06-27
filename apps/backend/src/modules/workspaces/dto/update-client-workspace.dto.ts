import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength } from 'class-validator';

export class UpdateClientWorkspaceDto {
  @ApiProperty({ example: 'Acme Inc.', maxLength: 200 })
  @IsString()
  @MaxLength(200)
  name!: string;
}
