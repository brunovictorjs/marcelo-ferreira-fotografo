import { randomUUID } from 'node:crypto';
import type { DomainEvent } from './domain-event.js';

export const newId = (): string => randomUUID();

/** Entidade: identidade estável + estado encapsulado em `props`. */
export abstract class Entity<Props extends object> {
  protected constructor(
    public readonly id: string,
    protected props: Props,
  ) {}

  equals(other?: Entity<Props>): boolean {
    return !!other && other.id === this.id;
  }

  /** Cópia rasa somente leitura do estado, para mapeadores e DTOs. */
  snapshot(): Readonly<Props> & { id: string } {
    return { id: this.id, ...this.props };
  }
}

/** Raiz de agregado: acumula eventos de domínio até a aplicação publicá-los. */
export abstract class AggregateRoot<Props extends object> extends Entity<Props> {
  private domainEvents: DomainEvent[] = [];

  protected record(event: DomainEvent): void {
    this.domainEvents.push(event);
  }

  pullEvents(): DomainEvent[] {
    const events = this.domainEvents;
    this.domainEvents = [];
    return events;
  }
}
