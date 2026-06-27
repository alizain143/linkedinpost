import { Controller, Get, Param, Post, Body, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import type { User } from '@prisma/client';
import { ApiDataResponse } from '../../common/swagger/api-data-response.decorator';
import {
  DocumentResponseDto,
  InitUploadResponseDto,
} from '../../common/swagger/responses/document-response.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ClerkAuthGuard } from '../../common/guards/clerk-auth.guard';
import { DocumentsService } from './documents.service';
import { InitUploadDto } from './dto/init-upload.dto';

@ApiTags('documents')
@ApiBearerAuth('bearer')
@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post('init')
  @UseGuards(ClerkAuthGuard)
  @ApiOperation({ summary: 'Initialize a presigned document upload' })
  @ApiDataResponse(InitUploadResponseDto, {
    description: 'Document ID and presigned upload URL',
  })
  initUpload(@CurrentUser() user: User, @Body() dto: InitUploadDto) {
    return this.documentsService.initUpload(user.id, dto);
  }

  @Get(':id')
  @UseGuards(ClerkAuthGuard)
  @ApiOperation({ summary: 'Get a document by ID' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiDataResponse(DocumentResponseDto)
  getDocument(@CurrentUser() user: User, @Param('id') id: string) {
    return this.documentsService.getDocumentForUser(id, user.id, true);
  }
}
