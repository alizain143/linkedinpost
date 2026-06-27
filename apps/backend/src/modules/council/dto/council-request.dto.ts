import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { QuickDraftRequestDto } from '../../generation/dto/quick-draft-request.dto';

export class CouncilRequestDto extends QuickDraftRequestDto {
  @ApiPropertyOptional({ example: 'Longer brief for the council run' })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  brief?: string;
}
