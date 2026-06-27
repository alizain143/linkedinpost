import { ApiProperty } from '@nestjs/swagger';

export class LogoutResponseDto {
  @ApiProperty({ example: true })
  success!: true;
}

export class WebhookReceivedResponseDto {
  @ApiProperty({ example: true })
  received!: boolean;
}
