import type { PriceMode, ServiceIcon } from '@mf/shared';
import { domainEvent, type Actor } from '../../../shared/domain/domain-event.js';
import { ValidationError } from '../../../shared/domain/domain-errors.js';
import { AggregateRoot, newId } from '../../../shared/domain/entity.js';

export interface ServiceData {
  name: string;
  description: string | null;
  includes: string[];
  priceMode: PriceMode;
  priceCents: number | null;
  icon: ServiceIcon;
  visible: boolean;
}

export interface ServiceProps extends ServiceData {
  position: number;
}

/** Serviço oferecido (card da seção "O que eu faço"). */
export class Service extends AggregateRoot<ServiceProps> {
  static restore(id: string, props: ServiceProps): Service {
    return new Service(id, props);
  }

  static create(data: ServiceData, position: number, actor: Actor): Service {
    const service = new Service(newId(), { ...Service.normalize(data), position });
    service.record(domainEvent('catalog.service.created', actor, { serviceId: service.id, name: data.name }));
    return service;
  }

  get name() { return this.props.name; }

  update(data: ServiceData, actor: Actor): void {
    Object.assign(this.props, Service.normalize(data));
    this.record(domainEvent('catalog.service.updated', actor, { serviceId: this.id, name: this.name }));
  }

  markDeletedBy(actor: Actor): void {
    this.record(domainEvent('catalog.service.deleted', actor, { serviceId: this.id, name: this.name }));
  }

  /** "Sob consulta" não guarda valor; os demais modos exigem valor. */
  private static normalize(data: ServiceData): ServiceData {
    if (data.priceMode === 'ON_REQUEST') return { ...data, priceCents: null };
    if (data.priceCents == null) throw new ValidationError('Informe o valor do serviço.', 'PRICE_REQUIRED');
    return data;
  }
}
