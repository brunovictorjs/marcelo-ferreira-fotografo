import { Injectable } from '@nestjs/common';
import type { SupabaseClient } from '@supabase/supabase-js';
import { FileStorage, type StoredFile } from '../../shared/application/ports.js';

/**
 * Produção: Supabase Storage. O bucket precisa ser público (leitura) —
 * as imagens do portfólio são servidas direto pela CDN do Supabase.
 */
@Injectable()
export class SupabaseFileStorage extends FileStorage {
  constructor(
    private readonly client: SupabaseClient,
    private readonly bucket: string,
  ) {
    super();
  }

  async put(key: string, body: Buffer, contentType: string): Promise<StoredFile> {
    const { error } = await this.client.storage
      .from(this.bucket)
      .upload(key, body, { contentType, upsert: true, cacheControl: '31536000' });
    if (error) throw new Error(`Falha ao enviar arquivo ao Supabase Storage: ${error.message}`);
    const { data } = this.client.storage.from(this.bucket).getPublicUrl(key);
    return { key, url: data.publicUrl };
  }

  async delete(key: string): Promise<void> {
    await this.client.storage.from(this.bucket).remove([key]);
  }

  keyFromUrl(url: string): string | null {
    const marker = `/storage/v1/object/public/${this.bucket}/`;
    const i = url.indexOf(marker);
    return i >= 0 ? url.slice(i + marker.length) : null;
  }
}
