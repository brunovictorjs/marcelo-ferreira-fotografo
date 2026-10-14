import { Body, Controller, Delete, Get, HttpCode, Param, Post, Put } from '@nestjs/common';
import { categorySchema, type ReorderInput, reorderSchema } from '@mf/shared';
import type { z } from 'zod';
import type { Actor } from '../../../shared/domain/domain-event.js';
import { CurrentActor } from '../../../shared/presentation/auth.decorators.js';
import { ZodValidationPipe } from '../../../shared/presentation/zod-validation.pipe.js';
import { CategoryUseCases } from '../application/category.use-cases.js';

type CategoryBody = z.output<typeof categorySchema>;

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categories: CategoryUseCases) {}

  @Get()
  list() {
    return this.categories.list();
  }

  @Post()
  create(@Body(new ZodValidationPipe(categorySchema)) body: CategoryBody, @CurrentActor() actor: Actor) {
    return this.categories.create(body, actor);
  }

  @Put('order')
  @HttpCode(204)
  async reorder(@Body(new ZodValidationPipe(reorderSchema)) body: ReorderInput, @CurrentActor() actor: Actor) {
    await this.categories.reorder(body.ids, actor);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(categorySchema)) body: CategoryBody,
    @CurrentActor() actor: Actor,
  ) {
    return this.categories.update(id, body, actor);
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@Param('id') id: string, @CurrentActor() actor: Actor) {
    await this.categories.delete(id, actor);
  }
}
