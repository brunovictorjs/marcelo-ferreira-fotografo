/**
 * Seed de desenvolvimento: cria o dono do site e o conteúdo de exemplo do protótipo.
 * Idempotente — só cria o que ainda não existe. Rode com `npm run db:seed`.
 */
import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '../src/infrastructure/database/generated/prisma/client.js';

const provider = process.env.DATABASE_PROVIDER === 'postgresql' ? 'postgresql' : 'sqlite';
const url = process.env.DATABASE_URL ?? 'file:./prisma/dev.db';
const prisma = new PrismaClient({
  adapter:
    provider === 'postgresql'
      ? new PrismaPg({ connectionString: url })
      : new PrismaBetterSqlite3({ url: url.replace(/^file:/, '') }),
});

const OWNER = {
  name: process.env.SEED_OWNER_NAME ?? 'Marcelo Ferreira',
  email: (process.env.SEED_OWNER_EMAIL ?? 'marcelo@example.com').toLowerCase(),
  password: process.env.SEED_OWNER_PASSWORD ?? 'trocar-esta-senha',
};

const CATEGORIES = [
  { slug: 'casamentos-e-eventos', name: 'Casamentos e eventos' },
  { slug: 'retratos', name: 'Retratos' },
  { slug: 'corporativo', name: 'Corporativo' },
  { slug: 'produto', name: 'Produto' },
];

const SERVICES = [
  { name: 'Retratos e ensaios', icon: 'PERSON', priceMode: 'ON_REQUEST', priceCents: null, description: 'Ensaios individuais, de casal, família e gestante, em estúdio ou externa.', includes: ['[Duração do ensaio]', '[Nº de fotos tratadas]', '[Prazo de entrega]'] },
  { name: 'Casamentos e eventos', icon: 'RINGS', priceMode: 'ON_REQUEST', priceCents: null, description: 'Cobertura completa do making of à festa, com olhar discreto e atento.', includes: ['[Horas de cobertura]', '[Galeria online]', '[Álbum opcional]'] },
  { name: 'Corporativo e marcas', icon: 'BRIEFCASE', priceMode: 'ON_REQUEST', priceCents: null, description: 'Retratos profissionais, equipes, espaços e campanhas para redes sociais.', includes: ['[Direção de imagem]', '[Licença de uso]', '[Prazo de entrega]'] },
  { name: 'Produto e gastronomia', icon: 'FOCUS', priceMode: 'ON_REQUEST', priceCents: null, description: 'Fotos de produto, cardápios e ambientes que fazem o cliente querer estar lá.', includes: ['[Nº de itens]', '[Fundo e produção]', '[Prazo de entrega]'] },
];

const PROJECTS = [
  { cat: 'casamentos-e-eventos', service: 'Casamentos e eventos', slug: 'casamento-nome-e-nome', title: 'Casamento [Nome & Nome]', summary: 'Cerimônia ao pôr do sol, cobertura completa do making of à festa.', featured: true },
  { cat: 'retratos', service: 'Retratos e ensaios', slug: 'ensaio-nome-do-cliente', title: 'Ensaio [Nome do cliente]', summary: 'Retrato autoral em estúdio, luz dura e fundo preto.', featured: true },
  { cat: 'corporativo', service: 'Corporativo e marcas', slug: 'empresa-retratos-da-equipe', title: '[Empresa] — Retratos da equipe', summary: 'Retratos padronizados para site e LinkedIn da equipe.', featured: false },
  { cat: 'produto', service: 'Produto e gastronomia', slug: 'cardapio-restaurante', title: 'Cardápio [Restaurante]', summary: 'Pratos, ambiente e equipe para o novo cardápio.', featured: false },
];

async function main() {
  if ((await prisma.user.count()) === 0) {
    await prisma.user.create({
      data: {
        id: randomUUID(),
        name: OWNER.name,
        email: OWNER.email,
        passwordHash: await bcrypt.hash(OWNER.password, 12),
        role: 'ADMIN',
        status: 'ACTIVE',
        isOwner: true,
      },
    });
    console.log(`✔ Dono do site criado: ${OWNER.email} / ${OWNER.password}`);
  }

  const categoryIds = new Map<string, string>();
  for (const [position, c] of CATEGORIES.entries()) {
    const row = await prisma.category.upsert({
      where: { slug: c.slug },
      create: { id: randomUUID(), ...c, position },
      update: {},
    });
    categoryIds.set(c.slug, row.id);
  }

  const serviceIds = new Map<string, string>();
  if ((await prisma.service.count()) === 0) {
    for (const [position, s] of SERVICES.entries()) {
      const id = randomUUID();
      await prisma.service.create({ data: { id, ...s, includes: JSON.stringify(s.includes), position } });
      serviceIds.set(s.name, id);
    }
    console.log('✔ Serviços de exemplo');
  }

  if ((await prisma.project.count()) === 0) {
    for (const [position, p] of PROJECTS.entries()) {
      // Os projetos de exemplo entram como RASCUNHO: publique-os pelo painel depois de enviar as fotos.
      await prisma.project.create({
        data: {
          id: randomUUID(),
          slug: p.slug,
          title: p.title,
          summary: p.summary,
          featured: p.featured,
          status: 'DRAFT',
          position,
          categoryId: categoryIds.get(p.cat)!,
          serviceId: serviceIds.get(p.service) ?? null,
          updatedByName: OWNER.name,
        },
      });
    }
    console.log('✔ Projetos de exemplo (rascunho)');
  }

  if ((await prisma.testimonial.count()) === 0) {
    const labels = ['Casamento', 'Ensaio', 'Corporativo'];
    for (const [position, job] of labels.entries()) {
      await prisma.testimonial.create({
        data: {
          id: randomUUID(),
          clientName: '[Nome do cliente]',
          jobLabel: `${job} • [ANO]`,
          quote: '[Depoimento do cliente, cadastrado por Marcelo na área administrativa. Até 280 caracteres.]',
          rating: 5,
          position,
        },
      });
    }
    console.log('✔ Depoimentos de exemplo');
  }
}

main()
  .then(() => console.log('Seed concluído.'))
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
