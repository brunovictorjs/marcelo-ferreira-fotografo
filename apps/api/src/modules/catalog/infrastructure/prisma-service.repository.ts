import { Injectable } from '@nestjs/common';
import type { PriceMode, ServiceIcon } from '@mf/shared';
import { PrismaService } from '../../../infrastructure/database/prisma.service.js';
import type { Service as ServiceRow } from '../../../infrastructure/database/generated/prisma/client.js';
import { ServiceRepository } from '../domain/ports.js';
import { Service } from '../domain/service.js';

const parseIncludes = (raw: string): string[] => {
  try {
    const value: unknown = JSON.parse(raw);
    return Array.isArray(value) ? value.map(String) : [];
  } catch {
    return [];
  }
};

const toDomain = (row: ServiceRow): Service =>
  Service.restore(row.id, {
    name: row.name,
    description: row.description,
    includes: parseIncludes(row.includes),
    priceMode: row.priceMode as PriceMode,
    priceCents: row.priceCents,
    icon: row.icon as ServiceIcon,
    visible: row.visible,
    position: row.position,
  });

@Injectable()
export class PrismaServiceRepository extends ServiceRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async list(options: { onlyVisible?: boolean } = {}) {
    const rows = await this.prisma.service.findMany({
      where: options.onlyVisible ? { visible: true } : undefined,
      orderBy: { position: 'asc' },
    });
    return rows.map(toDomain);
  }

  async findById(id: string) {
    const row = await this.prisma.service.findUnique({ where: { id } });
    return row ? toDomain(row) : null;
  }

  async nextPosition() {
    const last = await this.prisma.service.aggregate({ _max: { position: true } });
    return (last._max.position ?? -1) + 1;
  }

  async save(service: Service) {
    const { id, includes, ...rest } = service.snapshot();
    const data = { ...rest, includes: JSON.stringify(includes) };
    await this.prisma.service.upsert({ where: { id }, create: { id, ...data }, update: data });
  }

  async delete(id: string) {
    await this.prisma.service.delete({ where: { id } });
  }

  async reorder(ids: string[]) {
    await this.prisma.$transaction(ids.map((id, position) => this.prisma.service.update({ where: { id }, data: { position } })));
  }
}
