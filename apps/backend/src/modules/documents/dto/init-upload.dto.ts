import { DocumentPurpose } from '../../../common/constants/document.constants';
import { IsEnum, IsInt, IsString, MaxLength, Min } from 'class-validator';

export class InitUploadDto {
  @IsString()
  @MaxLength(255)
  filename: string;

  @IsString()
  mimeType: string;

  @IsInt()
  @Min(1)
  sizeBytes: number;

  @IsEnum(DocumentPurpose)
  purpose: DocumentPurpose;
}
