import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class AiCreateMediaTemplateDto {
  @ApiProperty({
    example:
      'Minimal white card, avatar and name top left, title top right, skills bottom left, Save & Repost bottom right, big headline center',
  })
  @IsString()
  @MinLength(10)
  @MaxLength(2000)
  prompt!: string;
}
