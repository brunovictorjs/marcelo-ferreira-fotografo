import { Injectable } from '@nestjs/common';
import type { ServiceDto, serviceSchema } from '@mf/shared';
import type { z } from 'zod';
import { EventBus } from '../../../shared/application/ports.js';
import { domainEvent, type Actor } from '../../../shared/domain/domain-event.js';
import { NotFoundError } from '../../../shared/domain/domain-errors.js';
import { ServiceRepository } from '../domain/ports.js';
import { Service } from '../domain/service.js';

type ServiceData = z.output<typeof serviceSchema>;

export const toServiceDto = (service: Service): ServiceDto => {
  const s = service.snapshot();
  return { ...s, includes: [...s.includes] };
};

@Injectable()
export class ServiceUseCases {
  constructor(
    private readonly services: ServiceRepository,
    private readonly events: EventBus,
  ) {}

  async list(onlyVisible = false): Promise<ServiceDto[]> {
    return (await this.services.list({ onlyVisible })).map(toServiceDto);
  }

  async create(data: ServiceData, actor: Actor): Promise<ServiceDto> {
    const service = Service.create(data, await this.services.nextPosition(), actor);
    await this.services.save(service);
    await this.events.publish(service.pullEvents());
    return toServiceDto(service);
  }

  async update(id: string, data: ServiceData, actor: Actor): Promise<ServiceDto> {
    const service = await this.get(id);
    service.update(data, actor);
    await this.services.save(service);
    await this.events.publish(service.pullEvents());
    return toServiceDto(service);
  }

  async delete(id: string, actor: Actor): Promise<void> {
    const service = await this.get(id);
    service.markDeletedBy(actor);
    await this.services.delete(id);
    await this.events.publish(service.pullEvents());
  }

  async reorder(ids: string[], actor: Actor): Promise<void> {
    await this.services.reorder(ids);
    await this.events.publish([domainEvent('catalog.service.reordered', actor, {})]);
  }

  private async get(id: string): Promise<Service> {
    const service = await this.services.findById(id);
    if (!service) throw new NotFoundError('Serviço');
    return service;
  }
}
