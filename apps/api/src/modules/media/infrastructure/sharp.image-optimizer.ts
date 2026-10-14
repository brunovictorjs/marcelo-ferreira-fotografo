import { Injectable } from '@nestjs/common';
import sharp from 'sharp';
import { ImageOptimizer, type OptimizedImage } from '../application/media.service.js';

@Injectable()
export class SharpImageOptimizer extends ImageOptimizer {
  async toWebp(input: Buffer, maxWidth: number, quality: number): Promise<OptimizedImage> {
    const { data, info } = await sharp(input)
      .rotate() // respeita a orientação EXIF da câmera
      .resize({ width: maxWidth, withoutEnlargement: true })
      .webp({ quality })
      .toBuffer({ resolveWithObject: true });
    return { data, width: info.width, height: info.height, contentType: 'image/webp' };
  }
}
