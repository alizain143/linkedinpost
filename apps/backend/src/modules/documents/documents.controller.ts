import { Controller, Get, Param, Post, Body, UseGuards } from '@nestjs/common';
import type { User } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ClerkAuthGuard } from '../../common/guards/clerk-auth.guard';
import { DocumentsService } from './documents.service';
import { InitUploadDto } from './dto/init-upload.dto';

@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post('init')
  @UseGuards(ClerkAuthGuard)
  initUpload(@CurrentUser() user: User, @Body() dto: InitUploadDto) {
    return this.documentsService.initUpload(user.id, dto);
  }

  @Get(':id')
  @UseGuards(ClerkAuthGuard)
  getDocument(@CurrentUser() user: User, @Param('id') id: string) {
    return this.documentsService.getDocumentForUser(id, user.id, true);
  }
}
