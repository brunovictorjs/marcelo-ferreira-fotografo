// Gera os schemas do Prisma de cada banco a partir de prisma/models.prisma.
// Uso: node scripts/prisma-schemas.mjs
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const models = readFileSync(join(root, 'prisma/models.prisma'), 'utf8');

const header = (provider) => `// ARQUIVO GERADO por scripts/prisma-schemas.mjs — NÃO EDITE.
// Edite prisma/models.prisma e rode \`npm run prisma:schemas\`.

generator client {
  provider               = "prisma-client"
  output                 = "../../src/infrastructure/database/generated/prisma"
  moduleFormat           = "esm"
  importFileExtension    = "js"
}

datasource db {
  provider = "${provider}"
}
`;

for (const provider of ['sqlite', 'postgresql']) {
  const dir = join(root, 'prisma', provider);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'schema.prisma'), `${header(provider)}\n${models}`);
  console.log(`✔ prisma/${provider}/schema.prisma`);
}
