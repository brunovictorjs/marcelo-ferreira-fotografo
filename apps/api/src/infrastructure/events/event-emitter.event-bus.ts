import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EventBus } from '../../shared/application/ports.js';
import type { DomainEvent } from '../../shared/domain/domain-event.js';

/**
 * Barramento em processo (monolito modular). Cada evento é emitido pelo nome
 * — ex. "portfolio.project.published". Assinantes genéricos (módulo de
 * atividade) usam o curinga "**".
 */
@Injectable()
export class EventEmitterEventBus extends EventBus {
  constructor(private readonly emitter: EventEmitter2) {
    super();
  }

  async publish(events: DomainEvent[]): Promise<void> {
    for (const event of events) {
      await this.emitter.emitAsync(event.name, event);
    }
  }
}
