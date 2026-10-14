import 'server-only';
import type {
  ActivityDto,
  CategoryDto,
  MessageFilter,
  MessageListDto,
  ProjectDetailDto,
  ProjectSummaryDto,
  ServiceDto,
  SessionUser,
  SiteSettingsDto,
  TestimonialDto,
  UserDto,
} from '@mf/shared';
import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import { connection } from 'next/server';
import { cache } from 'react';
import { API_URL, SESSION_COOKIE } from '../config';
import { ApiError } from './errors';

/**
 * Leituras do painel feitas no servidor do Next com o token do cookie.
 * Leem a requisição, então devem rodar dentro de um <Suspense>.
 */
async function adminGet<T>(path: string): Promise<T> {
  // O painel é sempre renderizado na hora da requisição. Sem isto, o Next de vez em
  // quando acusava `Date.now()` "durante a pré-renderização" no SessionArea (logo após
  // o login ou ao salvar), por chamadas que não vêm do nosso código.
  await connection();
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) redirect('/painel/login');
  const res = await fetch(`${API_URL}${path}`, {
    headers: { authorization: `Bearer ${token}`, accept: 'application/json' },
    cache: 'no-store',
  });
  if (res.status === 401) redirect('/painel/login?expirada=1');
  if (res.status === 403) redirect('/painel/mensagens');
  if (res.status === 404) notFound();
  if (!res.ok) throw await ApiError.fromResponse(res);
  return (await res.json()) as T;
}

/** Usuário logado — memorizado por requisição. */
export const getSessionUser = cache(() => adminGet<SessionUser>('/auth/me'));

export const admin = {
  messages: (filter: MessageFilter) => adminGet<MessageListDto>(`/messages?filter=${filter}`),
  unreadCount: () => adminGet<{ unreadMessages: number }>('/messages/unread-count'),
  projects: (categoryId?: string) =>
    adminGet<ProjectSummaryDto[]>(`/projects${categoryId ? `?categoryId=${encodeURIComponent(categoryId)}` : ''}`),
  project: (id: string) => adminGet<ProjectDetailDto>(`/projects/${encodeURIComponent(id)}`),
  categories: () => adminGet<CategoryDto[]>('/categories'),
  services: () => adminGet<ServiceDto[]>('/services'),
  testimonials: () => adminGet<TestimonialDto[]>('/testimonials'),
  users: () => adminGet<UserDto[]>('/users'),
  activity: () => adminGet<ActivityDto[]>('/activity?limit=8'),
  settings: () => adminGet<SiteSettingsDto>('/site-settings'),
};
