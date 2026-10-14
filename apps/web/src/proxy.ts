import { type NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE } from '@/lib/config';

/** Páginas do painel acessíveis sem sessão. */
const OPEN = ['/painel/login', '/painel/convite', '/painel/esqueci-senha', '/painel/redefinir-senha'];

/**
 * Checagem otimista: sem cookie de sessão, o painel redireciona para o login.
 * A validação de verdade acontece na API a cada requisição.
 */
export function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  if (OPEN.some((p) => pathname.startsWith(p))) return NextResponse.next();
  if (req.cookies.has(SESSION_COOKIE)) {
    if (pathname === '/painel' || pathname === '/painel/') {
      return NextResponse.redirect(new URL('/painel/mensagens', req.url));
    }
    return NextResponse.next();
  }
  const login = new URL('/painel/login', req.url);
  if (pathname !== '/painel') login.searchParams.set('next', pathname + search);
  return NextResponse.redirect(login);
}

export const config = {
  matcher: ['/painel', '/painel/:path*'],
};
