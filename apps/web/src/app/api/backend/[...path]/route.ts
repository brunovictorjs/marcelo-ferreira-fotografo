import { revalidateTag } from 'next/cache';
import { cookies } from 'next/headers';
import { type NextRequest, NextResponse } from 'next/server';
import { API_URL, PUBLIC_CACHE_TAG, SESSION_COOKIE } from '@/lib/config';

/**
 * BFF do painel: o navegador chama /api/backend/<rota> e este handler repassa
 * para a API NestJS com o token do cookie httpOnly (que o JavaScript do
 * navegador nunca vê). Também invalida o cache do site público depois de
 * qualquer alteração bem-sucedida.
 */
async function forward(req: NextRequest, ctx: RouteContext<'/api/backend/[...path]'>) {
  const { path } = await ctx.params;
  const mutating = req.method !== 'GET' && req.method !== 'HEAD';

  // Proteção CSRF: alterações só a partir do próprio site.
  if (mutating) {
    const origin = req.headers.get('origin');
    if (origin && origin !== req.nextUrl.origin) {
      return NextResponse.json({ statusCode: 403, code: 'BAD_ORIGIN', message: 'Origem não permitida.' }, { status: 403 });
    }
  }

  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ statusCode: 401, code: 'NO_SESSION', message: 'Entre novamente.' }, { status: 401 });
  }

  const target = `${API_URL}/${path.map(encodeURIComponent).join('/')}${req.nextUrl.search}`;
  const headers = new Headers({ authorization: `Bearer ${token}`, accept: 'application/json' });
  const contentType = req.headers.get('content-type');
  if (contentType) headers.set('content-type', contentType);

  const res = await fetch(target, {
    method: req.method,
    headers,
    body: mutating ? req.body : undefined,
    // Necessário para repassar o corpo como stream (uploads de fotos).
    ...(mutating ? { duplex: 'half' } : {}),
    cache: 'no-store',
  } as RequestInit);

  // expire: 0 → a próxima visita ao site já recebe o conteúdo novo (o painel promete isso).
  if (mutating && res.ok) revalidateTag(PUBLIC_CACHE_TAG, { expire: 0 });

  return new NextResponse(res.body, {
    status: res.status,
    headers: { 'content-type': res.headers.get('content-type') ?? 'application/json' },
  });
}

export const GET = forward;
export const POST = forward;
export const PUT = forward;
export const PATCH = forward;
export const DELETE = forward;
