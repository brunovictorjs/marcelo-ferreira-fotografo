import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';
import { Mailer, type MailMessage } from '../../shared/application/ports.js';

/** Produção: envio pelo Resend. */
@Injectable()
export class ResendMailer extends Mailer {
  private readonly client: Resend;

  constructor(
    apiKey: string,
    private readonly from: string,
  ) {
    super();
    this.client = new Resend(apiKey);
  }

  async send(message: MailMessage): Promise<void> {
    const { error } = await this.client.emails.send({
      from: this.from,
      to: message.to,
      cc: message.cc?.length ? message.cc : undefined,
      replyTo: message.replyTo,
      subject: message.subject,
      html: message.html,
      text: message.text,
    });
    if (error) throw new Error(`Resend: ${error.message}`);
  }
}

/** Desenvolvimento: só registra o e-mail no terminal (links de convite aparecem aqui). */
@Injectable()
export class ConsoleMailer extends Mailer {
  private readonly logger = new Logger('Mailer');

  async send(message: MailMessage): Promise<void> {
    const to = Array.isArray(message.to) ? message.to.join(', ') : message.to;
    this.logger.log(
      `\n──── e-mail (MAIL_DRIVER=console) ────\nPara: ${to}${message.cc?.length ? `\nCc: ${message.cc.join(', ')}` : ''}\nAssunto: ${message.subject}\n\n${message.text}\n─────────────────────────────────────`,
    );
  }
}
