import type { MessageFilter } from '@mf/shared';
import { domainEvent, type Actor } from '../../../shared/domain/domain-event.js';
import { AggregateRoot, newId } from '../../../shared/domain/entity.js';

export interface ContactMessageData {
  name: string;
  email: string;
  phone: string | null;
  workType: string;
  desiredDate: string | null;
  message: string;
}

export interface ContactMessageProps extends ContactMessageData {
  readAt: Date | null;
  answeredAt: Date | null;
  answeredById: string | null;
  answeredByName: string | null;
  archivedAt: Date | null;
  createdAt: Date;
}

/** Mensagem enviada pelo formulário "Vamos conversar?". */
export class ContactMessage extends AggregateRoot<ContactMessageProps> {
  static restore(id: string, props: ContactMessageProps): ContactMessage {
    return new ContactMessage(id, props);
  }

  static receive(data: ContactMessageData, now: Date): ContactMessage {
    const msg = new ContactMessage(newId(), {
      ...data,
      readAt: null,
      answeredAt: null,
      answeredById: null,
      answeredByName: null,
      archivedAt: null,
      createdAt: now,
    });
    msg.record(domainEvent('inbox.message.received', null, { messageId: msg.id, name: data.name }));
    return msg;
  }

  get data(): ContactMessageData & { createdAt: Date } {
    const { name, email, phone, workType, desiredDate, message, createdAt } = this.props;
    return { name, email, phone, workType, desiredDate, message, createdAt };
  }

  markRead(now: Date): void {
    this.props.readAt ??= now;
  }

  markAnswered(actor: Actor, now: Date): void {
    this.props.readAt ??= now;
    this.props.answeredAt = now;
    this.props.answeredById = actor.id;
    this.props.answeredByName = actor.name;
    this.record(domainEvent('inbox.message.answered', actor, { messageId: this.id, name: this.props.name }));
  }

  markPending(): void {
    this.props.answeredAt = null;
    this.props.answeredById = null;
    this.props.answeredByName = null;
  }

  archive(actor: Actor, now: Date): void {
    this.props.archivedAt = now;
    this.record(domainEvent('inbox.message.archived', actor, { messageId: this.id, name: this.props.name }));
  }
}

export abstract class ContactMessageRepository {
  abstract findById(id: string): Promise<ContactMessage | null>;
  /** Não arquivadas, mais recentes primeiro. */
  abstract list(filter: MessageFilter): Promise<ContactMessage[]>;
  abstract countUnread(): Promise<number>;
  abstract save(message: ContactMessage): Promise<void>;
}

export abstract class InboxNotifier {
  abstract notifyNewMessage(message: ContactMessage): Promise<void>;
}
