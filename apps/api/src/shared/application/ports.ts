/**
 * Portas (interfaces) da camada de aplicação compartilhadas entre módulos.
 * Classes abstratas servem de token de injeção do Nest; os adaptadores
 * concretos vivem em src/infrastructure.
 */
import type { DomainEvent } from '../domain/domain-event.js';

export abstract class EventBus {
  abstract publish(events: DomainEvent[]): Promise<void>;
}

export interface StoredFile {
  key: string;
  url: string;
}

export abstract class FileStorage {
  abstract put(key: string, body: Buffer, contentType: string): Promise<StoredFile>;
  abstract delete(key: string): Promise<void>;
  /** Extrai a chave de uma URL pública gerada por este storage (ou null). */
  abstract keyFromUrl(url: string): string | null;
}

export interface MailMessage {
  to: string | string[];
  cc?: string[];
  replyTo?: string;
  subject: string;
  html: string;
  text: string;
}

export abstract class Mailer {
  abstract send(message: MailMessage): Promise<void>;
}

export abstract class Clock {
  abstract now(): Date;
}

/** Repositórios que suportam reordenação por arrastar-e-soltar. */
export interface Reorderable {
  reorder(ids: string[]): Promise<void>;
}
