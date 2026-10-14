import { Injectable, Logger } from '@nestjs/common';
import type { contactMessageSchema, MessageDto, MessageFilter, MessageListDto } from '@mf/shared';
import type { z } from 'zod';
import { Clock, EventBus } from '../../../shared/application/ports.js';
import type { Actor } from '../../../shared/domain/domain-event.js';
import { NotFoundError } from '../../../shared/domain/domain-errors.js';
import { ContactMessage, ContactMessageRepository, InboxNotifier } from '../domain/contact-message.js';

type ContactData = z.output<typeof contactMessageSchema>;

const toDto = (m: ContactMessage): MessageDto => {
  const s = m.snapshot();
  return {
    id: s.id,
    name: s.name,
    email: s.email,
    phone: s.phone,
    workType: s.workType,
    desiredDate: s.desiredDate,
    message: s.message,
    read: !!s.readAt,
    answered: !!s.answeredAt,
    answeredByName: s.answeredByName,
    createdAt: s.createdAt.toISOString(),
  };
};

@Injectable()
export class InboxUseCases {
  private readonly logger = new Logger(InboxUseCases.name);

  constructor(
    private readonly messages: ContactMessageRepository,
    private readonly notifier: InboxNotifier,
    private readonly clock: Clock,
    private readonly events: EventBus,
  ) {}

  /** Visitante envia o formulário: salva em Mensagens e avisa por e-mail. */
  async receive(input: ContactData): Promise<void> {
    if (input.website) return; // honeypot preenchido: robô — descarta em silêncio
    const { website: _hp, ...data } = input;
    const message = ContactMessage.receive(data, this.clock.now());
    await this.messages.save(message);
    await this.events.publish(message.pullEvents());
    // Falha no e-mail não pode perder a mensagem: ela já está salva no painel.
    await this.notifier.notifyNewMessage(message).catch((e: unknown) => this.logger.error(`Falha ao enviar aviso por e-mail: ${String(e)}`));
  }

  async list(filter: MessageFilter): Promise<MessageListDto> {
    const [items, unreadCount] = await Promise.all([this.messages.list(filter), this.messages.countUnread()]);
    return { items: items.map(toDto), unreadCount };
  }

  countUnread(): Promise<number> {
    return this.messages.countUnread();
  }

  async markRead(id: string): Promise<MessageDto> {
    const m = await this.get(id);
    m.markRead(this.clock.now());
    await this.messages.save(m);
    return toDto(m);
  }

  async setAnswered(id: string, answered: boolean, actor: Actor): Promise<MessageDto> {
    const m = await this.get(id);
    if (answered) m.markAnswered(actor, this.clock.now());
    else m.markPending();
    await this.messages.save(m);
    await this.events.publish(m.pullEvents());
    return toDto(m);
  }

  async archive(id: string, actor: Actor): Promise<void> {
    const m = await this.get(id);
    m.archive(actor, this.clock.now());
    await this.messages.save(m);
    await this.events.publish(m.pullEvents());
  }

  private async get(id: string): Promise<ContactMessage> {
    const m = await this.messages.findById(id);
    if (!m) throw new NotFoundError('Mensagem');
    return m;
  }
}
