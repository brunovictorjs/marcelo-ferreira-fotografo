import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { USER_ROLE_LABEL } from '@mf/shared';
import type { Env } from '../../../config/env.js';
import { renderEmail } from '../../../infrastructure/mail/layout.js';
import { Mailer } from '../../../shared/application/ports.js';
import { IdentityNotifier } from '../domain/ports.js';
import { INVITE_TTL_HOURS, RESET_TTL_HOURS, type User } from '../domain/user.js';

@Injectable()
export class EmailIdentityNotifier extends IdentityNotifier {
  private readonly webUrl: string;

  constructor(
    private readonly mailer: Mailer,
    config: ConfigService<Env, true>,
  ) {
    super();
    this.webUrl = config.get('WEB_URL', { infer: true });
  }

  async sendInvite(user: User, token: string, invitedBy: string): Promise<void> {
    const url = `${this.webUrl}/painel/convite?token=${encodeURIComponent(token)}`;
    await this.mailer.send({
      to: user.email,
      subject: 'Seu acesso ao painel — Marcelo Ferreira Fotografia',
      ...renderEmail({
        heading: `Olá, ${user.name.split(' ')[0]}!`,
        paragraphs: [
          `${invitedBy} convidou você para o painel do site como ${USER_ROLE_LABEL[user.role]}.`,
          'Clique no botão abaixo para criar sua senha e entrar.',
        ],
        button: { label: 'CRIAR MINHA SENHA', url },
        footnote: `O link vale por ${INVITE_TTL_HOURS} horas. Se você não esperava este convite, ignore este e-mail.`,
      }),
    });
  }

  async sendPasswordReset(user: User, token: string): Promise<void> {
    const url = `${this.webUrl}/painel/redefinir-senha?token=${encodeURIComponent(token)}`;
    await this.mailer.send({
      to: user.email,
      subject: 'Redefinir senha — Marcelo Ferreira Fotografia',
      ...renderEmail({
        heading: 'Redefinir sua senha',
        paragraphs: ['Recebemos um pedido para redefinir a senha do seu acesso ao painel.'],
        button: { label: 'CRIAR NOVA SENHA', url },
        footnote: `O link vale por ${RESET_TTL_HOURS} horas. Se não foi você, ignore este e-mail — sua senha continua a mesma.`,
      }),
    });
  }
}
