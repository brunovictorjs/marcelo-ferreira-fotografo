import type { ProjectStatus } from '@mf/shared';
import { domainEvent, type Actor } from '../../../shared/domain/domain-event.js';
import { NotFoundError, ValidationError } from '../../../shared/domain/domain-errors.js';
import { AggregateRoot, Entity, newId } from '../../../shared/domain/entity.js';
import type { Slug } from '../../../shared/domain/slug.js';

export interface PhotoProps {
  storageKey: string;
  url: string;
  thumbUrl: string;
  width: number;
  height: number;
  caption: string | null;
  position: number;
}

export class Photo extends Entity<PhotoProps> {
  static restore(id: string, props: PhotoProps): Photo {
    return new Photo(id, props);
  }

  static create(props: Omit<PhotoProps, 'caption' | 'position'>, position: number): Photo {
    return new Photo(newId(), { ...props, caption: null, position });
  }

  get storageKey() { return this.props.storageKey; }
  get position() { return this.props.position; }

  setCaption(caption: string | null): void {
    this.props.caption = caption;
  }

  moveTo(position: number): void {
    this.props.position = position;
  }
}

/** Conteúdo editável do projeto (tudo que vem do formulário do painel). */
export interface ProjectContent {
  title: string;
  summary: string | null;
  client: string | null;
  date: string | null;
  location: string | null;
  delivery: string | null;
  team: string | null;
  intro: string | null;
  challenge: string | null;
  approach: string | null;
  result: string | null;
  categoryId: string;
  serviceId: string | null;
  featured: boolean;
}

export interface ProjectProps extends ProjectContent {
  slug: string;
  status: ProjectStatus;
  position: number;
  coverPhotoId: string | null;
  updatedById: string | null;
  updatedByName: string | null;
  publishedAt: Date | null;
  photos: Photo[];
}

/**
 * Agregado Projeto: um trabalho do portfólio com sua galeria de fotos.
 * Invariantes: a capa é sempre uma foto da galeria; só publica com ao menos uma foto.
 */
export class Project extends AggregateRoot<ProjectProps> {
  static restore(id: string, props: ProjectProps): Project {
    return new Project(id, props);
  }

  static createDraft(content: ProjectContent, slug: Slug, position: number, actor: Actor): Project {
    const project = new Project(newId(), {
      ...content,
      slug: slug.value,
      status: 'DRAFT',
      position,
      coverPhotoId: null,
      updatedById: actor.id,
      updatedByName: actor.name,
      publishedAt: null,
      photos: [],
    });
    project.record(domainEvent('portfolio.project.created', actor, { projectId: project.id, title: content.title }));
    return project;
  }

  get title() { return this.props.title; }
  get slug() { return this.props.slug; }
  get status() { return this.props.status; }
  get photos(): readonly Photo[] { return [...this.props.photos].sort((a, b) => a.position - b.position); }

  update(content: ProjectContent, slug: Slug, actor: Actor): void {
    Object.assign(this.props, content, { slug: slug.value });
    this.touch(actor);
    this.record(domainEvent('portfolio.project.updated', actor, { projectId: this.id, title: this.title }));
  }

  publish(actor: Actor, now: Date): void {
    if (this.props.photos.length === 0) {
      throw new ValidationError('Envie ao menos uma foto antes de publicar.', 'PROJECT_WITHOUT_PHOTOS');
    }
    this.props.status = 'PUBLISHED';
    this.props.publishedAt ??= now;
    this.touch(actor);
    this.record(domainEvent('portfolio.project.published', actor, { projectId: this.id, title: this.title }));
  }

  unpublish(actor: Actor): void {
    this.props.status = 'DRAFT';
    this.touch(actor);
    this.record(domainEvent('portfolio.project.unpublished', actor, { projectId: this.id, title: this.title }));
  }

  setFeatured(featured: boolean, actor: Actor): void {
    this.props.featured = featured;
    this.touch(actor);
  }

  addPhoto(data: Omit<PhotoProps, 'caption' | 'position'>, actor: Actor): Photo {
    const position = this.props.photos.reduce((max, p) => Math.max(max, p.position + 1), 0);
    const photo = Photo.create(data, position);
    this.props.photos.push(photo);
    this.props.coverPhotoId ??= photo.id;
    this.touch(actor);
    return photo;
  }

  /** Remove a foto e devolve-a para o chamador apagar o arquivo do storage. */
  removePhoto(photoId: string, actor: Actor): Photo {
    const photo = this.findPhoto(photoId);
    this.props.photos = this.props.photos.filter((p) => p.id !== photoId);
    if (this.props.coverPhotoId === photoId) this.props.coverPhotoId = this.photos[0]?.id ?? null;
    if (this.props.photos.length === 0 && this.status === 'PUBLISHED') this.props.status = 'DRAFT';
    this.touch(actor);
    return photo;
  }

  setCover(photoId: string, actor: Actor): void {
    this.findPhoto(photoId);
    this.props.coverPhotoId = photoId;
    this.touch(actor);
  }

  captionPhoto(photoId: string, caption: string | null, actor: Actor): void {
    this.findPhoto(photoId).setCaption(caption);
    this.touch(actor);
  }

  reorderPhotos(ids: string[], actor: Actor): void {
    const known = new Set(this.props.photos.map((p) => p.id));
    if (ids.length !== known.size || !ids.every((id) => known.has(id))) {
      throw new ValidationError('A nova ordem precisa conter todas as fotos do projeto.', 'INVALID_PHOTO_ORDER');
    }
    ids.forEach((id, index) => this.findPhoto(id).moveTo(index));
    this.touch(actor);
  }

  markDeletedBy(actor: Actor): void {
    this.record(domainEvent('portfolio.project.deleted', actor, { projectId: this.id, title: this.title }));
  }

  private findPhoto(photoId: string): Photo {
    const photo = this.props.photos.find((p) => p.id === photoId);
    if (!photo) throw new NotFoundError('Foto');
    return photo;
  }

  private touch(actor: Actor): void {
    this.props.updatedById = actor.id;
    this.props.updatedByName = actor.name;
  }
}
