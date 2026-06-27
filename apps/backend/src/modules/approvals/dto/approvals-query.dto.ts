import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { ApprovalTab } from '../approvals.constants';

export class ApprovalsQueryDto {
  @ApiPropertyOptional({
    enum: ApprovalTab,
    default: ApprovalTab.mine,
  })
  @IsOptional()
  @IsEnum(ApprovalTab)
  tab?: ApprovalTab;

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number;

  @ApiPropertyOptional({ default: 0, minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number;
}
