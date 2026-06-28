import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { CreateContentProfileDto } from './create-content-profile.dto';

export class ApproveContentProfileSuggestionsDto {
  @ApiProperty({ type: [CreateContentProfileDto], minItems: 1, maxItems: 3 })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(3)
  @ValidateNested({ each: true })
  @Type(() => CreateContentProfileDto)
  profiles!: CreateContentProfileDto[];
}
