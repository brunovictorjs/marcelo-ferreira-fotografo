# Marcelo Ferreira Fotografia

Site institucional + painel administrativo do fotógrafo Marcelo Ferreira, implementado a partir do protótipo de alta fidelidade.

| Camada | Stack |
| --- | --- |
| Front-end | Next.js 16 (App Router, Cache Components), TypeScript, Tailwind 4, shadcn/ui, GSAP |
| Back-end | NestJS 12 — monolito modular com DDD + Clean Architecture |
| Banco | Prisma 7 — **SQLite** em desenvolvimento, **Supabase (Postgres)** em produção |
| Arquivos | Disco local em desenvolvimento, **Supabase Storage** em produção |
| E-mail | Console em desenvolvimento, **Resend** em produção |

```
apps/
  web/        Next.js — site público (/) e painel (/painel)
  api/        NestJS — API REST
packages/
  shared/     Contratos (DTOs) e validações Zod usados pelos dois lados
```

## Primeiros passos

Requisitos: Node 22+.

```bash
npm install                      # instala tudo e gera o Prisma Client (SQLite)
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
# edite apps/api/.env: JWT_SECRET (obrigatório) e SEED_OWNER_* (login do Marcelo)

npm run db:setup                 # cria o banco SQLite, aplica migrations e roda o seed
npm run dev                      # shared (watch) + API :3333 + site :3000
```

- Site: http://localhost:3000
- Painel: http://localhost:3000/painel — entre com `SEED_OWNER_EMAIL` / `SEED_OWNER_PASSWORD`.
- Com `MAIL_DRIVER=console`, os e-mails (convites, redefinição de senha, aviso de nova mensagem) aparecem **no terminal da API**, com os links clicáveis.

O seed cria os projetos de exemplo do protótipo como **rascunho**: envie fotos pelo painel e clique em *Publicar* para que apareçam no site.

### Scripts úteis

| Comando | O que faz |
| --- | --- |
| `npm run dev` | Sobe tudo em modo desenvolvimento |
| `npm run build` | Build de produção dos três pacotes (a API precisa estar no ar para o `next build`, que pré-renderiza as páginas públicas) |
| `npm test` | Testes de domínio da API (Vitest) |
| `npm run lint` / `npm run typecheck` | Qualidade |
| `npm run db:migrate` | Cria/aplica migration após alterar `apps/api/prisma/models.prisma` |
| `npm run db:studio` | Prisma Studio |

## Arquitetura do back-end

Cada módulo é um *bounded context* com as mesmas camadas:

```
modules/<contexto>/
  domain/          Entidades, agregados e regras (sem Nest, sem Prisma) + portas (interfaces)
  application/     Casos de uso — orquestram domínio e portas
  infrastructure/  Adaptadores: repositórios Prisma, e-mail, segurança…
  presentation/    Controllers HTTP e handlers de eventos (adaptadores de entrada)
```

| Módulo | Responsabilidade |
| --- | --- |
| `identity` | Usuários, login JWT, convites, redefinição de senha, perfis Administrador/Editor |
| `portfolio` | Projetos (agregado com a galeria de fotos) e categorias |
| `catalog` | Serviços oferecidos |
| `testimonials` | Depoimentos |
| `inbox` | Mensagens do formulário de contato (+ aviso por e-mail) |
| `site-settings` | Hero, logos, sobre mim, contato, SEO |
| `media` | Upload e otimização de imagens (sharp → WebP grande + miniatura) |
| `activity` | "Atividade recente": assina todos os eventos de domínio |
| `public-site` | Composição de leitura para a página inicial |

Regras de convivência entre módulos:

- **Escrita** só pelo módulo dono. Módulos conversam por **eventos de domínio** (EventEmitter em processo) — ex.: ao escolher o depoimento de um projeto, `portfolio` publica `portfolio.project.testimonial_selected` e `testimonials` faz o vínculo; ao excluir um serviço, `portfolio` desvincula os projetos.
- **Leitura** (CQRS leve): consultas podem juntar tabelas de outros módulos só para montar DTOs.
- Portas compartilhadas (`EventBus`, `FileStorage`, `Mailer`, `Clock`) ficam em `shared/application/ports.ts`; os adaptadores são escolhidos pelo `.env` em `infrastructure/infrastructure.module.ts`.

Algumas regras de negócio implementadas no domínio: projeto só é publicado com ao menos uma foto; a capa é sempre uma foto da galeria; categoria com projetos não pode ser excluída; o dono do site não pode ser removido nem rebaixado; ninguém altera o próprio perfil; convites expiram em 72 h e links de senha em 2 h.

## Front-end

- **Site público** (`app/(site)`): dados via `'use cache'` com a tag `public-site`. Toda alteração feita no painel invalida essa tag, então o site reflete a mudança na próxima visita.
- **Painel** (`app/painel`): o navegador fala com um **BFF** (`/api/backend/*`) que injeta o token JWT guardado em cookie `httpOnly` — o JavaScript da página nunca vê o token. O BFF repassa uploads como stream e bloqueia requisições de outras origens.
- **Animações GSAP** (`components/motion`): entrada do hero (máscara nas linhas, assinatura "escrita", brilho no cromado, parallax), revelação das seções no scroll, transição **Flip** nos filtros do portfólio e lightbox. Tudo é desligado para quem usa *reduzir movimento*.

## Indo para produção (Supabase)

1. Crie o projeto no Supabase e um bucket **público** de Storage (ex.: `site-media`).
2. No `apps/api/.env` de produção:
   ```env
   DATABASE_PROVIDER=postgresql
   DATABASE_URL=postgresql://…pooler.supabase.com:6543/postgres?pgbouncer=true   # pooler (app)
   DIRECT_URL=postgresql://…pooler.supabase.com:5432/postgres                     # migrations
   STORAGE_DRIVER=supabase
   SUPABASE_URL=https://<ref>.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=…
   MAIL_DRIVER=resend
   RESEND_API_KEY=…
   MAIL_FROM="Marcelo Ferreira Fotografia <contato@seudominio.com.br>"
   WEB_URL=https://seudominio.com.br
   API_PUBLIC_URL=https://api.seudominio.com.br
   TRUST_PROXY=true
   ```
3. Gere o client para Postgres e aplique as migrations:
   ```bash
   cd apps/api
   npm run prisma:generate   # com DATABASE_PROVIDER=postgresql no ambiente
   npm run db:deploy
   npm run db:seed           # cria o acesso do Marcelo
   ```
4. No `apps/web`: `API_URL` (URL da API) e `NEXT_PUBLIC_SITE_URL`.

Detalhes importantes:

- O schema do Prisma tem **uma fonte única** (`apps/api/prisma/models.prisma`); `npm run prisma:schemas` gera as variantes `sqlite/` e `postgresql/`, cada uma com sua pasta de migrations. Ao mudar o modelo, rode `npm run db:migrate` no SQLite e gere a migration equivalente do Postgres (contra um banco de staging, ou com `prisma migrate diff`).
- A migration inicial do Postgres **liga RLS sem políticas** em todas as tabelas: a API REST automática do Supabase (chaves `anon`/`authenticated`) não enxerga nada; só a API NestJS acessa os dados.
- O client gerado do Prisma é específico do banco: sempre rode `prisma:generate` depois de trocar `DATABASE_PROVIDER`.
- O projeto está numa pasta do OneDrive; se a sincronização do `node_modules` ficar lenta, considere movê-lo para fora do OneDrive ou excluir a pasta da sincronização.
