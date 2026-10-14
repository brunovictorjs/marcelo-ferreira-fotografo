import { mkdir, unlink, writeFile } from 'node:fs/promises';
import { dirname, resolve, sep } from 'node:path';
import { Injectable } from '@nestjs/common';
import { FileStorage, type StoredFile } from '../../shared/application/ports.js';

/** Desenvolvimento: grava em disco e serve por GET /uploads/<key>. */
@Injectable()
export class LocalFileStorage extends FileStorage {
  private readonly root: string;

  constructor(
    uploadsDir: string,
    private readonly publicBaseUrl: string,
  ) {
    super();
    this.root = resolve(uploadsDir);
  }

  async put(key: string, body: Buffer): Promise<StoredFile> {
    const path = this.pathFor(key);
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, body);
    return { key, url: `${this.publicBaseUrl}/uploads/${key}` };
  }

  async delete(key: string): Promise<void> {
    await unlink(this.pathFor(key)).catch(() => undefined);
  }

  keyFromUrl(url: string): string | null {
    const prefix = `${this.publicBaseUrl}/uploads/`;
    return url.startsWith(prefix) ? url.slice(prefix.length) : null;
  }

  private pathFor(key: string): string {
    const path = resolve(this.root, key);
    if (!path.startsWith(this.root + sep)) throw new Error('Chave de arquivo inválida.');
    return path;
  }
}
