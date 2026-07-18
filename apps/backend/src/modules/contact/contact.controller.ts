import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiDataResponse } from '../../common/swagger/api-data-response.decorator';
import { ContactService } from './contact.service';
import {
  SubmitContactDto,
  SubmitContactResponseDto,
} from './dto/submit-contact.dto';

@ApiTags('contact')
@Controller('public/contact')
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  @Post()
  @ApiOperation({ summary: 'Submit the marketing contact form (no auth)' })
  @ApiDataResponse(SubmitContactResponseDto)
  submit(@Body() dto: SubmitContactDto) {
    return this.contactService.submit(dto);
  }
}
