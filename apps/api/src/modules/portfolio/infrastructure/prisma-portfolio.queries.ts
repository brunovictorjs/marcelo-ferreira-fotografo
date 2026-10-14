import { Injectable } from '@nestjs/common';
import type {
  CategoryDto,
  PhotoDto,
  ProjectDetailDto,
  ProjectStatus,
  ProjectSummaryDto,
  PublicProjectPageDto,
} from '@mf/shared';
import { PrismaService } from '../../../infrastructure/database/prisma.service.js';
import type { Prisma } from '../../../infrastructure/database/generated/prisma/client.js';
import { PortfolioQueries } from '../application/portfolio.queries.js';

const summaryInclude = {
  category: { select: { id: true, name: true, slug: true } },
  photos: { orderBy: { position: 'asc' } },
} satisfies Prisma.ProjectInclude;

type SummaryRow = Prisma.ProjectGetPayload<{ include: typeof summaryInclude }>;

const toPhoto = (p: SummaryRow['photos'][number]): PhotoDto => ({
  id: p.id,
  url: p.url,
  thumbUrl: p.thumbUrl,
  width: p.width,
  height: p.height,
  caption: p.caption,
  position: p.position,
});

function toSummary(row: SummaryRow): ProjectSummaryDto {
  const cover = row.photos.find((p) => p.id === row.coverPhotoId) ?? row.photos[0] ?? null;
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    summary: row.summary,
    year: row.date ? Number(row.date.slice(0, 4)) || null : null,
    status: row.status as ProjectStatus,
    featured: row.featured,
    position: row.position,
    category: row.category,
    coverUrl: cover?.url ?? null,
    coverThumbUrl: cover?.thumbUrl ?? null,
    photoCount: row.photos.length,
    updatedByName: row.updatedByName,
    updatedAt: row.updatedAt.toISOString(),
  };
}

/** Destaques primeiro, depois a ordem definida no painel. */
const projectOrder: Prisma.ProjectOrderByWithRelationInput[] = [{ featured: 'desc' }, { position: 'asc' }];

@Injectable()
export class PrismaPortfolioQueries extends PortfolioQueries {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async listCategories(options: { onlyVisible?: boolean } = {}): Promise<CategoryDto[]> {
    const rows = await this.prisma.category.findMany({
      where: options.onlyVisible ? { visibleInFilter: true } : undefined,
      orderBy: { position: 'asc' },
      include: {
        _count: { select: { projects: options.onlyVisible ? { where: { status: 'PUBLISHED' } } : true } },
      },
    });
    return rows
      .filter((r) => !options.onlyVisible || r._count.projects > 0)
      .map((r) => ({
        id: r.id,
        name: r.name,
        slug: r.slug,
        description: r.description,
        visibleInFilter: r.visibleInFilter,
        position: r.position,
        projectCount: r._count.projects,
      }));
  }

  async listProjects(options: { categoryId?: string; onlyPublished?: boolean }): Promise<ProjectSummaryDto[]> {
    const rows = await this.prisma.project.findMany({
      where: {
        categoryId: options.categoryId,
        status: options.onlyPublished ? 'PUBLISHED' : undefined,
      },
      orderBy: options.onlyPublished ? projectOrder : { position: 'asc' },
      include: summaryInclude,
    });
    return rows.map(toSummary);
  }

  async getProject(id: string): Promise<ProjectDetailDto | null> {
    const row = await this.prisma.project.findUnique({ where: { id }, include: summaryInclude });
    return row ? this.toDetail(row) : null;
  }

  async getPublishedPage(slug: string): Promise<PublicProjectPageDto | null> {
    const row = await this.prisma.project.findFirst({ where: { slug, status: 'PUBLISHED' }, include: summaryInclude });
    if (!row) return null;

    // "Próximo projeto": o seguinte na ordem do portfólio, voltando ao primeiro no fim.
    const ordered = await this.prisma.project.findMany({
      where: { status: 'PUBLISHED' },
      orderBy: projectOrder,
      select: { id: true, slug: true, title: true },
    });
    const i = ordered.findIndex((p) => p.id === row.id);
    const next = ordered.length > 1 ? ordered[(i + 1) % ordered.length] : null;

    return {
      project: await this.toDetail(row),
      next: next ? { slug: next.slug, title: next.title } : null,
    };
  }

  private async toDetail(row: SummaryRow): Promise<ProjectDetailDto> {
    const [service, testimonial] = await Promise.all([
      row.serviceId
        ? this.prisma.service.findUnique({ where: { id: row.serviceId }, select: { id: true, name: true } })
        : null,
      this.prisma.testimonial.findFirst({
        where: { projectId: row.id },
        orderBy: { position: 'asc' },
        select: { id: true, clientName: true, jobLabel: true, quote: true, rating: true },
      }),
    ]);
    return {
      ...toSummary(row),
      client: row.client,
      date: row.date,
      location: row.location,
      delivery: row.delivery,
      team: row.team,
      intro: row.intro,
      challenge: row.challenge,
      approach: row.approach,
      result: row.result,
      coverPhotoId: row.coverPhotoId,
      service,
      testimonial,
      photos: row.photos.map(toPhoto),
    };
  }
}
