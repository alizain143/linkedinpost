import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class BindWorkspaceLinkedInDto {
  @ApiPropertyOptional({
    description:
      'Clerk external account id to bind. Required when multiple LinkedIn accounts exist.',
  })
  @IsOptional()
  @IsString()
  clerkExternalAccountId?: string;
}
