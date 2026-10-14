import { Module } from '@nestjs/common';
import { ImageOptimizer, MediaService } from './application/media.service.js';
import { SharpImageOptimizer } from './infrastructure/sharp.image-optimizer.js';
import { MediaController } from './presentation/media.controller.js';

@Module({
  controllers: [MediaController],
  providers: [MediaService, { provide: ImageOptimizer, useClass: SharpImageOptimizer }],
  exports: [MediaService],
})
export class MediaModule {}
