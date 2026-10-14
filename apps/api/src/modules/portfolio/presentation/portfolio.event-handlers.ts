import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import type { DomainEvent } from '../../../shared/domain/domain-event.js';
import { ProjectRepository } from '../domain/ports.js';

/** Reações do portfólio a eventos de outros módulos (adaptador de entrada). */
@Injectable()
export class PortfolioEventHandlers {
  constructor(private readonly projects: ProjectRepository) {}

  @OnEvent('catalog.service.deleted')
  async onServiceDeleted(event: DomainEvent<{ serviceId: string }>) {
    await this.projects.detachService(event.payload.serviceId);
  }
}
