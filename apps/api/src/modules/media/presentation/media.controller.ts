import { Controller, Post, Query, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { IMAGE_MAX_BYTES } from '@mf/shared';
import { z } from 'zod';
import { ValidationError } from '../../../shared/domain/domain-errors.js';
import { ZodValidationPipe } from '../../../shared/presentation/zod-validation.pipe.js';
import { MEDIA_FOLDERS, type MediaFolder, MediaService } from '../application/media.service.js';

const folderQuery = z.object({ folder: z.enum(MEDIA_FOLDERS).default('site') });

/** Upload avulso de imagens (hero, sobre, logos, foto do cliente, SEO). */
@Controller('media')
export class MediaController {
  constructor(private readonly media: MediaService) {}

  @Post('images')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: IMAGE_MAX_BYTES } }))
  upload(
    @UploadedFile() file: Express.Multer.File | undefined,
    @Query(new ZodValidationPipe(folderQuery)) query: { folder: MediaFolder },
  ) {
    if (!file) throw new ValidationError('Nenhum arquivo enviado.', 'FILE_REQUIRED');
    return this.media.uploadImage(file, query.folder);
  }
}
