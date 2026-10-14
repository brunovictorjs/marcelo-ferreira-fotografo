import { Injectable } from '@nestjs/common';
import type { TestimonialDto, testimonialSchema } from '@mf/shared';
import type { z } from 'zod';
import { EventBus } from '../../../shared/application/ports.js';
import { domainEvent, type Actor } from '../../../shared/domain/domain-event.js';
import { NotFoundError } from '../../../shared/domain/domain-errors.js';
import { MediaService } from '../../media/application/media.service.js';
import { Testimonial, TestimonialRepository } from '../domain/testimonial.js';

type TestimonialData = z.output<typeof testimonialSchema>;
export type TestimonialFilter = 'all' | 'visible' | 'hidden';

export abstract class TestimonialQueries {
  abstract list(filter: TestimonialFilter, limit?: number): Promise<TestimonialDto[]>;
  abstract get(id: string): Promise<TestimonialDto | null>;
}

@Injectable()
export class TestimonialUseCases {
  constructor(
    private readonly testimonials: TestimonialRepository,
    private readonly queries: TestimonialQueries,
    private readonly media: MediaService,
    private readonly events: EventBus,
  ) {}

  list(filter: TestimonialFilter = 'all', limit?: number): Promise<TestimonialDto[]> {
    return this.queries.list(filter, limit);
  }

  async create(data: TestimonialData, actor: Actor): Promise<TestimonialDto> {
    const t = Testimonial.create(data, await this.testimonials.nextPosition(), actor);
    await this.persist(t, data.projectId);
    return this.dto(t.id);
  }

  async update(id: string, data: TestimonialData, actor: Actor): Promise<TestimonialDto> {
    const t = await this.get(id);
    const previousPhoto = t.photoUrl;
    t.update(data, actor);
    await this.persist(t, data.projectId);
    if (previousPhoto && previousPhoto !== data.photoUrl) await this.media.deleteByUrl(previousPhoto);
    return this.dto(id);
  }

  async setVisible(id: string, visible: boolean, actor: Actor): Promise<void> {
    const t = await this.get(id);
    t.setVisible(visible, actor);
    await this.testimonials.save(t);
    await this.events.publish(t.pullEvents());
  }

  async delete(id: string, actor: Actor): Promise<void> {
    const t = await this.get(id);
    t.markDeletedBy(actor);
    await this.testimonials.delete(id);
    await this.events.publish(t.pullEvents());
    await this.media.deleteByUrl(t.photoUrl);
  }

  async reorder(ids: string[], actor: Actor): Promise<void> {
    await this.testimonials.reorder(ids);
    await this.events.publish([domainEvent('testimonials.testimonial.reordered', actor, {})]);
  }

  /** Chamado pelo handler do evento do portfólio. */
  linkToProject(projectId: string, testimonialId: string | null): Promise<void> {
    return this.testimonials.linkToProject(projectId, testimonialId);
  }

  unlinkProject(projectId: string): Promise<void> {
    return this.testimonials.unlinkProject(projectId);
  }

  private async persist(t: Testimonial, projectId: string | null): Promise<void> {
    await this.testimonials.save(t);
    if (projectId) await this.testimonials.linkToProject(projectId, t.id);
    await this.events.publish(t.pullEvents());
  }

  private async get(id: string): Promise<Testimonial> {
    const t = await this.testimonials.findById(id);
    if (!t) throw new NotFoundError('Depoimento');
    return t;
  }

  private async dto(id: string): Promise<TestimonialDto> {
    return (await this.queries.get(id))!;
  }
}
