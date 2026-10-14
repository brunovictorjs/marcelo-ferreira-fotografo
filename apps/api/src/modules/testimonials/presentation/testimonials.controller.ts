import { Body, Controller, Delete, Get, HttpCode, Injectable, Param, Patch, Post, Put, Query } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { type ReorderInput, reorderSchema, testimonialSchema, testimonialVisibilitySchema } from '@mf/shared';
import { z } from 'zod';
import type { Actor, DomainEvent } from '../../../shared/domain/domain-event.js';
import { CurrentActor } from '../../../shared/presentation/auth.decorators.js';
import { ZodValidationPipe } from '../../../shared/presentation/zod-validation.pipe.js';
import { type TestimonialFilter, TestimonialUseCases } from '../application/testimonial.use-cases.js';

type TestimonialBody = z.output<typeof testimonialSchema>;
const filterQuery = z.object({ filter: z.enum(['all', 'visible', 'hidden']).default('all') });

@Controller('testimonials')
export class TestimonialsController {
  constructor(private readonly testimonials: TestimonialUseCases) {}

  @Get()
  list(@Query(new ZodValidationPipe(filterQuery)) query: { filter: TestimonialFilter }) {
    return this.testimonials.list(query.filter);
  }

  @Post()
  create(@Body(new ZodValidationPipe(testimonialSchema)) body: TestimonialBody, @CurrentActor() actor: Actor) {
    return this.testimonials.create(body, actor);
  }

  @Put('order')
  @HttpCode(204)
  async reorder(@Body(new ZodValidationPipe(reorderSchema)) body: ReorderInput, @CurrentActor() actor: Actor) {
    await this.testimonials.reorder(body.ids, actor);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(testimonialSchema)) body: TestimonialBody,
    @CurrentActor() actor: Actor,
  ) {
    return this.testimonials.update(id, body, actor);
  }

  @Patch(':id/visibility')
  @HttpCode(204)
  async visibility(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(testimonialVisibilitySchema)) body: { visible: boolean },
    @CurrentActor() actor: Actor,
  ) {
    await this.testimonials.setVisible(id, body.visible, actor);
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@Param('id') id: string, @CurrentActor() actor: Actor) {
    await this.testimonials.delete(id, actor);
  }
}

/** Mantém o vínculo depoimento ↔ projeto coerente com o que acontece no portfólio. */
@Injectable()
export class TestimonialEventHandlers {
  constructor(private readonly testimonials: TestimonialUseCases) {}

  @OnEvent('portfolio.project.testimonial_selected')
  async onSelected(event: DomainEvent<{ projectId: string; testimonialId: string | null }>) {
    await this.testimonials.linkToProject(event.payload.projectId, event.payload.testimonialId);
  }

  @OnEvent('portfolio.project.deleted')
  async onProjectDeleted(event: DomainEvent<{ projectId: string }>) {
    await this.testimonials.unlinkProject(event.payload.projectId);
  }
}
