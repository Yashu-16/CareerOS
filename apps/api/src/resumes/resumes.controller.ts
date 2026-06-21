import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, CurrentUserPayload } from '../auth/current-user.decorator';
import { ResumesService } from './resumes.service';

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

@UseGuards(JwtAuthGuard)
@Controller('resumes')
export class ResumesController {
  constructor(private readonly resumesService: ResumesService) {}

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: MAX_FILE_SIZE_BYTES },
    }),
  )
  async upload(
    @CurrentUser() user: CurrentUserPayload,
    @UploadedFile() file: Express.Multer.File,
    @Query('isMaster') isMaster?: string,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded. Field name must be "file".');
    }
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException('Only PDF and DOCX files are supported.');
    }

    return this.resumesService.uploadAndParse(user.userId, file, isMaster !== 'false');
  }

  @Get()
  list(@CurrentUser() user: CurrentUserPayload) {
    return this.resumesService.list(user.userId);
  }

  @Get('master')
  getMaster(@CurrentUser() user: CurrentUserPayload) {
    return this.resumesService.getMaster(user.userId);
  }

  @Get(':id')
  getOne(@CurrentUser() user: CurrentUserPayload, @Param('id') id: string) {
    return this.resumesService.getOne(user.userId, id);
  }

  @Delete(':id')
  delete(@CurrentUser() user: CurrentUserPayload, @Param('id') id: string) {
    return this.resumesService.delete(user.userId, id);
  }
}
