import { Injectable, Logger } from '@nestjs/common';
import { IMAGE_MAX_BYTES, IMAGE_MIME_TYPES, type UploadedImageDto } from '@mf/shared';
import { FileStorage } from '../../../shared/application/ports.js';
import { newId } from '../../../shared/domain/entity.js';
import { ValidationError } from '../../../shared/domain/domain-errors.js';

export interface IncomingImage {
  buffer: Buffer;
  mimetype: string;
  size: number;
}

export interface OptimizedImage {
  data: Buffer;
  width: number;
  height: number;
  contentType: string;
}

export abstract class ImageOptimizer {
  abstract toWebp(input: Buffer, maxWidth: number, quality: number): Promise<OptimizedImage>;
}

export const MEDIA_FOLDERS = ['projects', 'site', 'logos', 'testimonials'] as const;
export type MediaFolder = (typeof MEDIA_FOLDERS)[number];

/**
 * Fachada pública do módulo de mídia, usada por outros módulos.
 * Gera duas versões otimizadas (grande + miniatura) em WebP.
 * SVG (logos) é guardado como veio.
 */
@Injectable()
export class MediaService {
  private readonly logger = new Logger(MediaService.name);

  constructor(
    private readonly storage: FileStorage,
    private readonly optimizer: ImageOptimizer,
  ) {}

  async uploadImage(file: IncomingImage, folder: MediaFolder): Promise<UploadedImageDto> {
    if (!(IMAGE_MIME_TYPES as readonly string[]).includes(file.mimetype)) {
      throw new ValidationError('Formato não suportado. Envie JPG, WEBP, PNG ou SVG.', 'INVALID_IMAGE_TYPE');
    }
    if (file.size > IMAGE_MAX_BYTES) {
      throw new ValidationError('Arquivo maior que 20 MB.', 'IMAGE_TOO_LARGE');
    }
    const base = `${folder}/${newId()}`;

    if (file.mimetype === 'image/svg+xml') {
      const stored = await this.storage.put(`${base}.svg`, file.buffer, file.mimetype);
      return { key: stored.key, url: stored.url, thumbUrl: stored.url, width: 0, height: 0 };
    }

    const [large, thumb] = await Promise.all([
      this.optimizer.toWebp(file.buffer, 2400, 82),
      this.optimizer.toWebp(file.buffer, 800, 76),
    ]);
    const [storedLarge, storedThumb] = await Promise.all([
      this.storage.put(`${base}.webp`, large.data, large.contentType),
      this.storage.put(`${base}-thumb.webp`, thumb.data, thumb.contentType),
    ]);
    return {
      key: storedLarge.key,
      url: storedLarge.url,
      thumbUrl: storedThumb.url,
      width: large.width,
      height: large.height,
    };
  }

  /** Remove o arquivo e sua miniatura. Falhas são só registradas (limpeza best-effort). */
  async deleteByKey(key: string): Promise<void> {
    const keys = key.endsWith('.webp') ? [key, key.replace(/\.webp$/, '-thumb.webp')] : [key];
    await Promise.all(
      keys.map((k) => this.storage.delete(k).catch((e: unknown) => this.logger.warn(`Falha ao remover ${k}: ${String(e)}`))),
    );
  }

  async deleteByUrl(url: string | null | undefined): Promise<void> {
    const key = url ? this.storage.keyFromUrl(url) : null;
    if (key) await this.deleteByKey(key);
  }
}
