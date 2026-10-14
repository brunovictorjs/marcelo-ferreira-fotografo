import type { Reorderable } from '../../../shared/application/ports.js';
import type { Category } from './category.js';
import type { Project } from './project.js';

export abstract class CategoryRepository implements Reorderable {
  abstract findById(id: string): Promise<Category | null>;
  abstract slugTaken(slug: string, exceptId?: string): Promise<boolean>;
  abstract countProjects(categoryId: string): Promise<number>;
  abstract nextPosition(): Promise<number>;
  abstract save(category: Category): Promise<void>;
  abstract delete(id: string): Promise<void>;
  abstract reorder(ids: string[]): Promise<void>;
}

export abstract class ProjectRepository implements Reorderable {
  abstract findById(id: string): Promise<Project | null>;
  abstract slugTaken(slug: string, exceptId?: string): Promise<boolean>;
  abstract nextPosition(): Promise<number>;
  abstract save(project: Project): Promise<void>;
  abstract delete(id: string): Promise<void>;
  abstract reorder(ids: string[]): Promise<void>;
  /** Quando um serviço do catálogo é excluído, os projetos deixam de apontar para ele. */
  abstract detachService(serviceId: string): Promise<void>;
}
