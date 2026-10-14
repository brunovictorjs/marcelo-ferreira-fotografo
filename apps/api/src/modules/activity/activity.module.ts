import { Controller, Get, Injectable, Module, Query } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import type { ActivityDto } from '@mf/shared';
import { PrismaService } from '../../infrastructure/database/prisma.service.js';
import type { DomainEvent } from '../../shared/domain/domain-event.js';
import { newId } from '../../shared/domain/entity.js';
import { Roles } from '../../shared/presentation/auth.decorators.js';

type Payload = Record<string, unknown>;
const q = (v: unknown) => `“${typeof v === 'string' ? v : ''}”`;

/**
 * Como cada evento de domínio aparece em "Atividade recente".
 * Eventos fora desta lista não são registrados.
 */
const DESCRIBE: Record<string, (p: Payload) => string> = {
  'portfolio.project.created': (p) => `criou o projeto ${q(p.title)}`,
  'portfolio.project.updated': (p) => `editou o projeto ${q(p.title)}`,
  'portfolio.project.published': (p) => `publicou ${q(p.title)}`,
  'portfolio.project.unpublished': (p) => `voltou ${q(p.title)} para rascunho`,
  'portfolio.project.deleted': (p) => `excluiu o projeto ${q(p.title)}`,
  'portfolio.project.reordered': () => 'reordenou o portfólio',
  'portfolio.category.created': (p) => `criou a categoria ${q(p.name)}`,
  'portfolio.category.updated': (p) => `editou a categoria ${q(p.name)}`,
  'portfolio.category.deleted': (p) => `excluiu a categoria ${q(p.name)}`,
  'catalog.service.created': (p) => `criou o serviço ${q(p.name)}`,
  'catalog.service.updated': (p) => `editou o serviço ${q(p.name)}`,
  'catalog.service.deleted': (p) => `excluiu o serviço ${q(p.name)}`,
  'testimonials.testimonial.created': (p) => `cadastrou o depoimento de ${String(p.clientName)}`,
  'testimonials.testimonial.updated': (p) => `editou o depoimento de ${String(p.clientName)}`,
  'testimonials.testimonial.shown': (p) => `mostrou no site o depoimento de ${String(p.clientName)}`,
  'testimonials.testimonial.hidden': (p) => `ocultou o depoimento de ${String(p.clientName)}`,
  'testimonials.testimonial.deleted': (p) => `excluiu o depoimento de ${String(p.clientName)}`,
  'inbox.message.answered': (p) => `respondeu a mensagem de ${String(p.name)}`,
  'inbox.message.archived': (p) => `arquivou a mensagem de ${String(p.name)}`,
  'site.settings.updated': (p) => `alterou ${String(p.label)}`,
  'identity.user.invited': (p) => `convidou ${String(p.name)}`,
  'identity.user.activated': () => 'ativou o próprio acesso',
  'identity.user.role_changed': (p) => `alterou o perfil de ${String(p.name)}`,
  'identity.user.removed': (p) => `removeu o acesso de ${String(p.name)}`,
};

/** Assinante genérico do barramento: transforma eventos em registros de auditoria. */
@Injectable()
export class ActivityRecorder {
  constructor(private readonly prisma: PrismaService) {}

  @OnEvent('**')
  async record(event: DomainEvent<Payload>): Promise<void> {
    const describe = DESCRIBE[event.name];
    if (!describe || !event.actor) return;
    await this.prisma.activityLog.create({
      data: {
        id: newId(),
        actorId: event.actor.id,
        actorName: event.actor.name,
        action: event.name,
        description: describe(event.payload),
        createdAt: event.occurredAt,
      },
    });
  }
}

@Roles('ADMIN')
@Controller('activity')
export class ActivityController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async recent(@Query('limit') limit?: string): Promise<ActivityDto[]> {
    const take = Math.min(Math.max(Number(limit) || 8, 1), 50);
    const rows = await this.prisma.activityLog.findMany({ orderBy: { createdAt: 'desc' }, take });
    return rows.map((r) => ({
      id: r.id,
      actorName: r.actorName,
      description: r.description,
      createdAt: r.createdAt.toISOString(),
    }));
  }
}

@Module({
  controllers: [ActivityController],
  providers: [ActivityRecorder],
})
export class ActivityModule {}
