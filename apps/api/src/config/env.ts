import { z } from 'zod';

const bool = z
  .enum(['true', 'false', '1', '0'])
  .transform((v) => v === 'true' || v === '1');

const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().default(3333),
    /** URL pública do site (Next.js) — CORS e links nos e-mails. */
    WEB_URL: z.url().default('http://localhost:3000'),
    /** URL pública desta API — usada nas URLs de arquivos do storage local. */
    API_PUBLIC_URL: z.url().default('http://localhost:3333'),

    DATABASE_PROVIDER: z.enum(['sqlite', 'postgresql']).default('sqlite'),
    DATABASE_URL: z.string().min(1).default('file:./prisma/dev.db'),

    JWT_SECRET: z.string().min(32, 'JWT_SECRET precisa ter ao menos 32 caracteres.'),
    JWT_EXPIRES_IN_HOURS: z.coerce.number().int().positive().default(12),

    STORAGE_DRIVER: z.enum(['local', 'supabase']).default('local'),
    UPLOADS_DIR: z.string().default('uploads'),
    SUPABASE_URL: z.url().optional(),
    SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
    SUPABASE_STORAGE_BUCKET: z.string().default('site-media'),

    MAIL_DRIVER: z.enum(['console', 'resend']).default('console'),
    RESEND_API_KEY: z.string().optional(),
    MAIL_FROM: z.string().default('Marcelo Ferreira Fotografia <nao-responda@example.com>'),

    TRUST_PROXY: bool.default(false),
  })
  .superRefine((env, ctx) => {
    if (env.STORAGE_DRIVER === 'supabase' && (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY)) {
      ctx.addIssue({
        code: 'custom',
        path: ['STORAGE_DRIVER'],
        message: 'STORAGE_DRIVER=supabase exige SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY.',
      });
    }
    if (env.MAIL_DRIVER === 'resend' && !env.RESEND_API_KEY) {
      ctx.addIssue({
        code: 'custom',
        path: ['MAIL_DRIVER'],
        message: 'MAIL_DRIVER=resend exige RESEND_API_KEY.',
      });
    }
    if (env.DATABASE_PROVIDER === 'postgresql' && !env.DATABASE_URL.startsWith('postgres')) {
      ctx.addIssue({
        code: 'custom',
        path: ['DATABASE_URL'],
        message: 'DATABASE_PROVIDER=postgresql exige uma DATABASE_URL postgres://…',
      });
    }
  });

export type Env = z.infer<typeof envSchema>;

/** Usado pelo ConfigModule: falha cedo, com mensagem clara, se o .env estiver errado. */
export function validateEnv(raw: Record<string, unknown>): Env {
  const parsed = envSchema.safeParse(raw);
  if (!parsed.success) {
    const lines = parsed.error.issues.map((i) => `  • ${i.path.join('.')}: ${i.message}`);
    throw new Error(`Variáveis de ambiente inválidas:\n${lines.join('\n')}`);
  }
  return parsed.data;
}
