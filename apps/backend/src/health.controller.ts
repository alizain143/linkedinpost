import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiDataResponse } from './common/swagger/api-data-response.decorator';
import { HealthResponseDto } from './common/swagger/responses/health-response.dto';

@ApiTags('health')
@Controller('health')
export class HealthController {
  @Get()
  @ApiOperation({ summary: 'Health check' })
  @ApiDataResponse(HealthResponseDto)
  health() {
    return { status: 'ok' };
  }
}
