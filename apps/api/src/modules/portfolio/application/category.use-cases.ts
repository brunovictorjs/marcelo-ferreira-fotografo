import { Injectable } from '@nestjs/common';
import { type CategoryDto, type categorySchema } from '@mf/shared';
import type { z } from 'zod';
import { EventBus } from '../../../shared/application/ports.js';
import { uniqueSlug } from '../../../shared/application/unique-slug.js';
import { domainEvent, type Actor } from '../../../shared/domain/domain-event.js';
import { NotFoundError } from '../../../shared/domain/domain-errors.js';
import { Category } from '../domain/category.js';
import { CategoryRepository } from '../domain/ports.js';
import { PortfolioQueries } from './portfolio.queries.js';

type CategoryData = z.output<typeof categorySchema>;

@Injectable()
export class CategoryUseCases {
  constructor(
    private readonly categories: CategoryRepository,
    private readonly queries: PortfolioQueries,
    private readonly events: EventBus,
  ) {}

  list(): Promise<CategoryDto[]> {
    return this.queries.listCategories();
  }

  async create(data: CategoryData, actor: Actor): Promise<CategoryDto> {
    const slug = await uniqueSlug(data.name, (s) => this.categories.slugTaken(s));
    const category = Category.create(data, slug, await this.categories.nextPosition(), actor);
    await this.categories.save(category);
    await this.events.publish(category.pullEvents());
    return this.dto(category.id);
  }

  async update(id: string, data: CategoryData, actor: Actor): Promise<CategoryDto> {
    const category = await this.get(id);
    const slug =
      data.name === category.name ? category.slug : await uniqueSlug(data.name, (s) => this.categories.slugTaken(s, id));
    category.update(data, slug, actor);
    await this.categories.save(category);
    await this.events.publish(category.pullEvents());
    return this.dto(id);
  }

  async delete(id: string, actor: Actor): Promise<void> {
    const category = await this.get(id);
    category.markDeletedBy(actor, await this.categories.countProjects(id));
    await this.categories.delete(id);
    await this.events.publish(category.pullEvents());
  }

  async reorder(ids: string[], actor: Actor): Promise<void> {
    await this.categories.reorder(ids);
    await this.events.publish([domainEvent('portfolio.category.reordered', actor, {})]);
  }

  private async get(id: string): Promise<Category> {
    const category = await this.categories.findById(id);
    if (!category) throw new NotFoundError('Categoria');
    return category;
  }

  private async dto(id: string): Promise<CategoryDto> {
    const all = await this.queries.listCategories();
    return all.find((c) => c.id === id)!;
  }
}
