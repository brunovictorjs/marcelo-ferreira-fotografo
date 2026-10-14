import { Injectable } from '@nestjs/common';
import type { UserRole, UserStatus } from '@mf/shared';
import { PrismaService } from '../../../infrastructure/database/prisma.service.js';
import type { User as UserRow } from '../../../infrastructure/database/generated/prisma/client.js';
import { UserRepository } from '../domain/ports.js';
import { User } from '../domain/user.js';

const toDomain = (row: UserRow): User =>
  User.restore(row.id, {
    name: row.name,
    email: row.email,
    passwordHash: row.passwordHash,
    role: row.role as UserRole,
    status: row.status as UserStatus,
    isOwner: row.isOwner,
    lastAccessAt: row.lastAccessAt,
    inviteTokenHash: row.inviteTokenHash,
    inviteExpiresAt: row.inviteExpiresAt,
    resetTokenHash: row.resetTokenHash,
    resetExpiresAt: row.resetExpiresAt,
    createdAt: row.createdAt,
  });

@Injectable()
export class PrismaUserRepository extends UserRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findById(id: string) {
    const row = await this.prisma.user.findUnique({ where: { id } });
    return row ? toDomain(row) : null;
  }

  async findByEmail(email: string) {
    const row = await this.prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    return row ? toDomain(row) : null;
  }

  async findByInviteTokenHash(hash: string) {
    const row = await this.prisma.user.findUnique({ where: { inviteTokenHash: hash } });
    return row ? toDomain(row) : null;
  }

  async findByResetTokenHash(hash: string) {
    const row = await this.prisma.user.findUnique({ where: { resetTokenHash: hash } });
    return row ? toDomain(row) : null;
  }

  async list() {
    const rows = await this.prisma.user.findMany({ orderBy: { createdAt: 'asc' } });
    return rows.map(toDomain);
  }

  count() {
    return this.prisma.user.count();
  }

  async save(user: User) {
    const { id, ...data } = user.snapshot();
    await this.prisma.user.upsert({ where: { id }, create: { id, ...data }, update: data });
  }

  async delete(id: string) {
    await this.prisma.user.delete({ where: { id } });
  }
}
