import { Body, Controller, Delete, Get, HttpCode, Param, Post, Put } from '@nestjs/common';
import { type ReorderInput, reorderSchema, serviceSchema } from '@mf/shared';
import type { z } from 'zod';
import type { Actor } from '../../../shared/domain/domain-event.js';
import { CurrentActor } from '../../../shared/presentation/auth.decorators.js';
import { ZodValidationPipe } from '../../../shared/presentation/zod-validation.pipe.js';
import { ServiceUseCases } from '../application/service.use-cases.js';

type ServiceBody = z.output<typeof serviceSchema>;

@Controller('services')
export class ServicesController {
  constructor(private readonly services: ServiceUseCases) {}

  @Get()
  list() {
    return this.services.list();
  }

  @Post()
  create(@Body(new ZodValidationPipe(serviceSchema)) body: ServiceBody, @CurrentActor() actor: Actor) {
    return this.services.create(body, actor);
  }

  @Put('order')
  @HttpCode(204)
  async reorder(@Body(new ZodValidationPipe(reorderSchema)) body: ReorderInput, @CurrentActor() actor: Actor) {
    await this.services.reorder(body.ids, actor);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(serviceSchema)) body: ServiceBody,
    @CurrentActor() actor: Actor,
  ) {
    return this.services.update(id, body, actor);
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@Param('id') id: string, @CurrentActor() actor: Actor) {
    await this.services.delete(id, actor);
  }
}
