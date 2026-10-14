'use server';

import {
  acceptInviteSchema,
  forgotPasswordSchema,
  type LoginResponse,
  loginSchema,
  resetPasswordSchema,
} from '@mf/shared';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { ApiError } from '../api/errors';
import { API_URL, SESSION_COOKIE } from '../config';

export interface FormState {
  error?: string;
  fieldErrors?: Record<string, string>;
  success?: string;
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
    cache: 'no-store',
  });
  if (!res.ok) throw await ApiError.fromResponse(res);
  return (res.status === 204 ? undefined : await res.json()) as T;
}

async function startSession(session: LoginResponse) {
  (await cookies()).set(SESSION_COOKIE, session.accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: new Date(session.expiresAt),
  });
}

const fail = (e: unknown): FormState =>
  e instanceof ApiError
    ? { error: e.message, fieldErrors: e.fieldErrors() }
    : { error: 'Não foi possível conectar. Tente novamente.' };

/** Só aceita redirecionar para dentro do painel. */
const safeNext = (value: FormDataEntryValue | null) => {
  const next = typeof value === 'string' ? value : '';
  return next.startsWith('/painel/') && !next.startsWith('//') ? next : '/painel/mensagens';
};

export async function loginAction(_: FormState, form: FormData): Promise<FormState> {
  const parsed = loginSchema.safeParse({ email: form.get('email'), password: form.get('password') });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  try {
    await startSession(await post<LoginResponse>('/auth/login', parsed.data));
  } catch (e) {
    return fail(e);
  }
  redirect(safeNext(form.get('next')));
}

export async function logoutAction(): Promise<void> {
  (await cookies()).delete(SESSION_COOKIE);
  redirect('/painel/login');
}

export async function acceptInviteAction(_: FormState, form: FormData): Promise<FormState> {
  if (form.get('password') !== form.get('confirm')) return { error: 'As senhas não conferem.' };
  const parsed = acceptInviteSchema.safeParse({ token: form.get('token'), password: form.get('password') });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  try {
    await startSession(await post<LoginResponse>('/auth/invite/accept', parsed.data));
  } catch (e) {
    return fail(e);
  }
  redirect('/painel/mensagens');
}

export async function forgotPasswordAction(_: FormState, form: FormData): Promise<FormState> {
  const parsed = forgotPasswordSchema.safeParse({ email: form.get('email') });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  try {
    await post('/auth/password/forgot', parsed.data);
  } catch (e) {
    return fail(e);
  }
  return { success: 'Se o e-mail estiver cadastrado, você vai receber um link para criar uma nova senha.' };
}

export async function resetPasswordAction(_: FormState, form: FormData): Promise<FormState> {
  if (form.get('password') !== form.get('confirm')) return { error: 'As senhas não conferem.' };
  const parsed = resetPasswordSchema.safeParse({ token: form.get('token'), password: form.get('password') });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  try {
    await post('/auth/password/reset', parsed.data);
  } catch (e) {
    return fail(e);
  }
  redirect('/painel/login?senha=1');
}
