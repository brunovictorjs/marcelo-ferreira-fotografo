import { Injectable } from '@nestjs/common';
import type { ProjectStatus } from '@mf/shared';
import { PrismaService } from '../../../infrastructure/database/prisma.service.js';
import { Category } from '../domain/category.js';
import { CategoryRepository, ProjectRepository } from '../domain/ports.js';
import { Photo, Project } from '../domain/project.js';

const slugTaken = async (count: Promise<number>) => (await count) > 0;

@Injectable()
export class PrismaCategoryRepository extends CategoryRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findById(id: string) {
    const row = await this.prisma.category.findUnique({ where: { id } });
    if (!row) return null;
    const { id: _id, createdAt: _c, updatedAt: _u, ...props } = row;
    return Category.restore(row.id, props);
  }

  slugTaken(slug: string, exceptId?: string) {
    return slugTaken(this.prisma.category.count({ where: { slug, NOT: exceptId ? { id: exceptId } : undefined } }));
  }

  countProjects(categoryId: string) {
    return this.prisma.project.count({ where: { categoryId } });
  }

  async nextPosition() {
    const last = await this.prisma.category.aggregate({ _max: { position: true } });
    return (last._max.position ?? -1) + 1;
  }

  async save(category: Category) {
    const { id, ...data } = category.snapshot();
    await this.prisma.category.upsert({ where: { id }, create: { id, ...data }, update: data });
  }

  async delete(id: string) {
    await this.prisma.category.delete({ where: { id } });
  }

  async reorder(ids: string[]) {
    await this.prisma.$transaction(ids.map((id, position) => this.prisma.category.update({ where: { id }, data: { position } })));
  }
}

@Injectable()
export class PrismaProjectRepository extends ProjectRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findById(id: string) {
    const row = await this.prisma.project.findUnique({ where: { id }, include: { photos: true } });
    if (!row) return null;
    const { id: _id, createdAt: _c, updatedAt: _u, photos, ...props } = row;
    return Project.restore(row.id, {
      ...props,
      status: props.status as ProjectStatus,
      photos: photos.map(({ id: photoId, projectId: _p, createdAt: _pc, ...p }) => Photo.restore(photoId, p)),
    });
  }

  slugTaken(slug: string, exceptId?: string) {
    return slugTaken(this.prisma.project.count({ where: { slug, NOT: exceptId ? { id: exceptId } : undefined } }));
  }

  async nextPosition() {
    const last = await this.prisma.project.aggregate({ _max: { position: true } });
    return (last._max.position ?? -1) + 1;
  }

  /** Grava o agregado inteiro: projeto + sincronização da galeria, numa transação. */
  async save(project: Project) {
    const { id, photos, ...data } = project.snapshot();
    const photoRows = photos.map((p) => ({ ...p.snapshot(), projectId: id }));
    await this.prisma.$transaction([
      this.prisma.project.upsert({ where: { id }, create: { id, ...data }, update: data }),
      this.prisma.photo.deleteMany({ where: { projectId: id, id: { notIn: photoRows.map((p) => p.id) } } }),
      ...photoRows.map((p) => this.prisma.photo.upsert({ where: { id: p.id }, create: p, update: p })),
    ]);
  }

  async delete(id: string) {
    await this.prisma.project.delete({ where: { id } });
  }

  async reorder(ids: string[]) {
    await this.prisma.$transaction(ids.map((id, position) => this.prisma.project.update({ where: { id }, data: { position } })));
  }

  async detachService(serviceId: string) {
    await this.prisma.project.updateMany({ where: { serviceId }, data: { serviceId: null } });
  }
}
