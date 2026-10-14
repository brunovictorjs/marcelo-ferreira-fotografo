import { Injectable, Logger, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaPg } from '@prisma/adapter-pg';
import type { Env } from '../../config/env.js';
import { PrismaClient } from './generated/prisma/client.js';

/**
 * Cliente Prisma com o driver adapter escolhido por DATABASE_PROVIDER.
 * Atenção: o client gerado é específico do provider — ao trocar de banco,
 * rode `npm run prisma:generate` com o novo DATABASE_PROVIDER.
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor(config: ConfigService<Env, true>) {
    const provider = config.get('DATABASE_PROVIDER', { infer: true });
    const url = config.get('DATABASE_URL', { infer: true });
    const adapter =
      provider === 'postgresql'
        ? new PrismaPg({ connectionString: url })
        : new PrismaBetterSqlite3({ url: url.replace(/^file:/, '') });
    super({ adapter });
    this.logger.log(`Banco de dados: ${provider}`);
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
