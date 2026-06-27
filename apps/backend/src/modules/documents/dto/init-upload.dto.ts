import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DocumentPurpose } from '../../../common/constants/document.constants';
import { IsEnum, IsInt, IsString, MaxLength, Min } from 'class-validator';

export class InitUploadDto {
  @ApiProperty({ example: 'avatar.png', maxLength: 255 })
  @IsString()
  @MaxLength(255)
  filename!: string;

  @ApiProperty({ example: 'image/png' })
  @IsString()
  mimeType!: string;

  @ApiProperty({ example: 102400, minimum: 1 })
  @IsInt()
  @Min(1)
  sizeBytes!: number;

  @ApiProperty({ enum: DocumentPurpose, example: DocumentPurpose.PROFILE })
  @IsEnum(DocumentPurpose)
  purpose!: DocumentPurpose;
}
