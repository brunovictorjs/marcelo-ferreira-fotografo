import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { MessageFilter } from '@mf/shared';
import type { Env } from '../../../config/env.js';
import { PrismaService } from '../../../infrastructure/database/prisma.service.js';
import { renderEmail } from '../../../infrastructure/mail/layout.js';
import { Mailer } from '../../../shared/application/ports.js';
import { SiteSettingsReader } from '../../site-settings/application/site-settings.use-cases.js';
import { ContactMessage, ContactMessageRepository, InboxNotifier } from '../domain/contact-message.js';

@Injectable()
export class PrismaContactMessageRepository extends ContactMessageRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findById(id: string) {
    const row = await this.prisma.contactMessage.findUnique({ where: { id } });
    if (!row) return null;
    const { id: _id, ...props } = row;
    return ContactMessage.restore(row.id, props);
  }

  async list(filter: MessageFilter) {
    const rows = await this.prisma.contactMessage.findMany({
      where: {
        archivedAt: null,
        ...(filter === 'pending' ? { answeredAt: null } : filter === 'answered' ? { NOT: { answeredAt: null } } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(({ id, ...props }) => ContactMessage.restore(id, props));
  }

  countUnread() {
    return this.prisma.contactMessage.count({ where: { archivedAt: null, readAt: null } });
  }

  async save(message: ContactMessage) {
    const { id, ...data } = message.snapshot();
    await this.prisma.contactMessage.upsert({ where: { id }, create: { id, ...data }, update: data });
  }
}

/** Envia cada nova mensagem para o e-mail definido em Configurações › Contato. */
@Injectable()
export class EmailInboxNotifier extends InboxNotifier {
  private readonly logger = new Logger(EmailInboxNotifier.name);
  private readonly webUrl: string;

  constructor(
    private readonly mailer: Mailer,
    private readonly settings: SiteSettingsReader,
    config: ConfigService<Env, true>,
  ) {
    super();
    this.webUrl = config.get('WEB_URL', { infer: true });
  }

  async notifyNewMessage(message: ContactMessage): Promise<void> {
    const contact = await this.settings.contact();
    if (!contact.recipientEmail) {
      this.logger.warn('Nenhum e-mail de recebimento configurado (Configurações › Contato). A mensagem ficou só no painel.');
      return;
    }
    const m = message.data;
    const cc = contact.ccEmails
      .split(',')
      .map((e) => e.trim())
      .filter(Boolean);
    await this.mailer.send({
      to: contact.recipientEmail,
      cc,
      replyTo: m.email,
      subject: `Nova mensagem pelo site — ${m.name} (${m.workType})`,
      ...renderEmail({
        heading: 'Nova mensagem pelo site',
        paragraphs: ['Responda direto a este e-mail para falar com o cliente.'],
        rows: [
          ['Nome', m.name],
          ['E-mail', m.email],
          ['WhatsApp', m.phone ?? '—'],
          ['Trabalho', m.workType],
          ['Data desejada', m.desiredDate ?? '—'],
          ['Mensagem', m.message],
        ],
        button: { label: 'ABRIR NO PAINEL', url: `${this.webUrl}/painel/mensagens` },
      }),
    });
  }
}
