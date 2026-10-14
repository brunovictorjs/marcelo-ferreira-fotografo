'use client';

import { ApiError } from './errors';

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

interface Options {
  method?: Method;
  json?: unknown;
  form?: FormData;
}

/**
 * Cliente do painel no navegador. Fala com o BFF (/api/backend), que injeta
 * o token. Sessão expirada → volta para o login.
 */
export async function api<T = void>(path: string, { method = 'GET', json, form }: Options = {}): Promise<T> {
  const res = await fetch(`/api/backend${path}`, {
    method,
    headers: json !== undefined ? { 'content-type': 'application/json' } : undefined,
    body: json !== undefined ? JSON.stringify(json) : form,
  });
  if (res.status === 401) {
    // Recarga completa de propósito: descarta o estado do painel com a sessão vencida.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.href = '/painel/login?expirada=1';
    throw new ApiError(401, 'SESSION_EXPIRED', 'Sessão expirada.');
  }
  if (!res.ok) throw await ApiError.fromResponse(res);
  if (res.status === 204) return undefined as T;
  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}
