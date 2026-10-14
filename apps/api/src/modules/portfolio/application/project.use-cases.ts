import { Injectable } from '@nestjs/common';
import type { ProjectDetailDto, ProjectSummaryDto, projectSchema, PublicProjectPageDto } from '@mf/shared';
import type { z } from 'zod';
import { Clock, EventBus } from '../../../shared/application/ports.js';
import { uniqueSlug } from '../../../shared/application/unique-slug.js';
import { domainEvent, type Actor } from '../../../shared/domain/domain-event.js';
import { NotFoundError } from '../../../shared/domain/domain-errors.js';
import { type IncomingImage, MediaService } from '../../media/application/media.service.js';
import { CategoryRepository, ProjectRepository } from '../domain/ports.js';
import { Project, type ProjectContent } from '../domain/project.js';
import { PortfolioQueries } from './portfolio.queries.js';

type ProjectData = z.output<typeof projectSchema>;

/** Evento de integração: o módulo de depoimentos vincula o depoimento escolhido. */
export const PROJECT_TESTIMONIAL_SELECTED = 'portfolio.project.testimonial_selected';

@Injectable()
export class ProjectUseCases {
  constructor(
    private readonly projects: ProjectRepository,
    private readonly categories: CategoryRepository,
    private readonly queries: PortfolioQueries,
    private readonly media: MediaService,
    private readonly events: EventBus,
    private readonly clock: Clock,
  ) {}

  // ── Leitura ────────────────────────────────────────────────────────────────

  list(categoryId?: string): Promise<ProjectSummaryDto[]> {
    return this.queries.listProjects({ categoryId });
  }

  async detail(id: string): Promise<ProjectDetailDto> {
    const dto = await this.queries.getProject(id);
    if (!dto) throw new NotFoundError('Projeto');
    return dto;
  }

  async publicPage(slug: string): Promise<PublicProjectPageDto> {
    const page = await this.queries.getPublishedPage(slug);
    if (!page) throw new NotFoundError('Projeto');
    return page;
  }

  // ── Escrita ────────────────────────────────────────────────────────────────

  async create(data: ProjectData, actor: Actor): Promise<ProjectDetailDto> {
    await this.ensureCategory(data.categoryId);
    const slug = await uniqueSlug(data.slug ?? data.title, (s) => this.projects.slugTaken(s));
    const project = Project.createDraft(this.content(data), slug, await this.projects.nextPosition(), actor);
    await this.commit(project, actor, data.testimonialId);
    return this.detail(project.id);
  }

  async update(id: string, data: ProjectData, actor: Actor): Promise<ProjectDetailDto> {
    const project = await this.get(id);
    await this.ensureCategory(data.categoryId);
    const wanted = data.slug ?? project.slug;
    const slug = await uniqueSlug(wanted, (s) => this.projects.slugTaken(s, id));
    project.update(this.content(data), slug, actor);
    await this.commit(project, actor, data.testimonialId);
    return this.detail(id);
  }

  async publish(id: string, actor: Actor): Promise<ProjectDetailDto> {
    const project = await this.get(id);
    project.publish(actor, this.clock.now());
    await this.commit(project, actor);
    return this.detail(id);
  }

  async unpublish(id: string, actor: Actor): Promise<ProjectDetailDto> {
    const project = await this.get(id);
    project.unpublish(actor);
    await this.commit(project, actor);
    return this.detail(id);
  }

  async setFeatured(id: string, featured: boolean, actor: Actor): Promise<void> {
    const project = await this.get(id);
    project.setFeatured(featured, actor);
    await this.commit(project, actor);
  }

  async delete(id: string, actor: Actor): Promise<void> {
    const project = await this.get(id);
    const keys = project.photos.map((p) => p.storageKey);
    project.markDeletedBy(actor);
    await this.projects.delete(id);
    await this.events.publish(project.pullEvents());
    await Promise.all(keys.map((k) => this.media.deleteByKey(k)));
  }

  async reorder(ids: string[], actor: Actor): Promise<void> {
    await this.projects.reorder(ids);
    await this.events.publish([domainEvent('portfolio.project.reordered', actor, {})]);
  }

  // ── Galeria ────────────────────────────────────────────────────────────────

  async addPhotos(id: string, files: IncomingImage[], actor: Actor): Promise<ProjectDetailDto> {
    const project = await this.get(id);
    for (const file of files) {
      const img = await this.media.uploadImage(file, 'projects');
      project.addPhoto(
        { storageKey: img.key, url: img.url, thumbUrl: img.thumbUrl, width: img.width, height: img.height },
        actor,
      );
    }
    await this.commit(project, actor);
    return this.detail(id);
  }

  async removePhoto(id: string, photoId: string, actor: Actor): Promise<ProjectDetailDto> {
    const project = await this.get(id);
    const removed = project.removePhoto(photoId, actor);
    await this.commit(project, actor);
    await this.media.deleteByKey(removed.storageKey);
    return this.detail(id);
  }

  async setCover(id: string, photoId: string, actor: Actor): Promise<ProjectDetailDto> {
    const project = await this.get(id);
    project.setCover(photoId, actor);
    await this.commit(project, actor);
    return this.detail(id);
  }

  async captionPhoto(id: string, photoId: string, caption: string | null, actor: Actor): Promise<void> {
    const project = await this.get(id);
    project.captionPhoto(photoId, caption, actor);
    await this.commit(project, actor);
  }

  async reorderPhotos(id: string, ids: string[], actor: Actor): Promise<ProjectDetailDto> {
    const project = await this.get(id);
    project.reorderPhotos(ids, actor);
    await this.commit(project, actor);
    return this.detail(id);
  }

  // ── Internos ───────────────────────────────────────────────────────────────

  private async get(id: string): Promise<Project> {
    const project = await this.projects.findById(id);
    if (!project) throw new NotFoundError('Projeto');
    return project;
  }

  private async ensureCategory(categoryId: string): Promise<void> {
    if (!(await this.categories.findById(categoryId))) throw new NotFoundError('Categoria');
  }

  private content(data: ProjectData): ProjectContent {
    const { slug: _slug, testimonialId: _t, ...content } = data;
    return content;
  }

  private async commit(project: Project, actor: Actor, testimonialId?: string | null): Promise<void> {
    await this.projects.save(project);
    const events = project.pullEvents();
    if (testimonialId !== undefined) {
      events.push(domainEvent(PROJECT_TESTIMONIAL_SELECTED, actor, { projectId: project.id, testimonialId }));
    }
    await this.events.publish(events);
  }
}
