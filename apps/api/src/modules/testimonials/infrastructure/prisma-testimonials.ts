import { Injectable } from '@nestjs/common';
import type { TestimonialDto } from '@mf/shared';
import { PrismaService } from '../../../infrastructure/database/prisma.service.js';
import type { Testimonial as TestimonialRow } from '../../../infrastructure/database/generated/prisma/client.js';
import { TestimonialQueries, type TestimonialFilter } from '../application/testimonial.use-cases.js';
import { Testimonial, TestimonialRepository } from '../domain/testimonial.js';

@Injectable()
export class PrismaTestimonialRepository extends TestimonialRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findById(id: string) {
    const row = await this.prisma.testimonial.findUnique({ where: { id } });
    if (!row) return null;
    const { id: _id, createdAt: _c, updatedAt: _u, ...props } = row;
    return Testimonial.restore(row.id, props);
  }

  async nextPosition() {
    const last = await this.prisma.testimonial.aggregate({ _max: { position: true } });
    return (last._max.position ?? -1) + 1;
  }

  async save(t: Testimonial) {
    const { id, ...data } = t.snapshot();
    await this.prisma.testimonial.upsert({ where: { id }, create: { id, ...data }, update: data });
  }

  async delete(id: string) {
    await this.prisma.testimonial.delete({ where: { id } });
  }

  async reorder(ids: string[]) {
    await this.prisma.$transaction(
      ids.map((id, position) => this.prisma.testimonial.update({ where: { id }, data: { position } })),
    );
  }

  async linkToProject(projectId: string, testimonialId: string | null) {
    await this.prisma.$transaction([
      this.prisma.testimonial.updateMany({
        where: { projectId, NOT: testimonialId ? { id: testimonialId } : undefined },
        data: { projectId: null },
      }),
      ...(testimonialId
        ? [this.prisma.testimonial.updateMany({ where: { id: testimonialId }, data: { projectId } })]
        : []),
    ]);
  }

  async unlinkProject(projectId: string) {
    await this.prisma.testimonial.updateMany({ where: { projectId }, data: { projectId: null } });
  }
}

@Injectable()
export class PrismaTestimonialQueries extends TestimonialQueries {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async list(filter: TestimonialFilter, limit?: number): Promise<TestimonialDto[]> {
    const rows = await this.prisma.testimonial.findMany({
      where: filter === 'all' ? undefined : { visible: filter === 'visible' },
      orderBy: { position: 'asc' },
      take: limit,
    });
    return this.withProjects(rows);
  }

  async get(id: string): Promise<TestimonialDto | null> {
    const row = await this.prisma.testimonial.findUnique({ where: { id } });
    return row ? (await this.withProjects([row]))[0]! : null;
  }

  /** Leitura do título do projeto vinculado (tabela do módulo de portfólio, só leitura). */
  private async withProjects(rows: TestimonialRow[]): Promise<TestimonialDto[]> {
    const ids = [...new Set(rows.map((r) => r.projectId).filter((v): v is string => !!v))];
    const projects = ids.length
      ? await this.prisma.project.findMany({ where: { id: { in: ids } }, select: { id: true, title: true } })
      : [];
    const byId = new Map(projects.map((p) => [p.id, p]));
    return rows.map((r) => ({
      id: r.id,
      clientName: r.clientName,
      jobLabel: r.jobLabel,
      quote: r.quote,
      rating: r.rating,
      visible: r.visible,
      position: r.position,
      photoUrl: r.photoUrl,
      project: r.projectId ? (byId.get(r.projectId) ?? null) : null,
    }));
  }
}
