import 'dotenv/config';
import { defineConfig } from 'prisma/config';

/**
 * O banco é escolhido por DATABASE_PROVIDER:
 *   sqlite      → desenvolvimento local (arquivo prisma/dev.db)
 *   postgresql  → produção no Supabase
 * Cada provider tem o próprio schema gerado e a própria pasta de migrations.
 */
const provider = process.env.DATABASE_PROVIDER === 'postgresql' ? 'postgresql' : 'sqlite';

// No Supabase a aplicação usa o pooler (DATABASE_URL, porta 6543) e o CLI do
// Prisma (migrate) usa a conexão direta (DIRECT_URL, porta 5432).
const url =
  provider === 'postgresql'
    ? (process.env.DIRECT_URL ?? process.env.DATABASE_URL)
    : (process.env.DATABASE_URL ?? 'file:./prisma/dev.db');

export default defineConfig({
  schema: `prisma/${provider}/schema.prisma`,
  migrations: {
    path: `prisma/${provider}/migrations`,
    seed: 'tsx prisma/seed.ts',
  },
  datasource: { url },
});
