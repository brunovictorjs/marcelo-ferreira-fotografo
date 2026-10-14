'use server';

import { contactMessageSchema } from '@mf/shared';
import { ApiError } from '../api/errors';
import { API_URL } from '../config';
import type { FormState } from './auth';

/** Formulário "Vamos conversar?" do site. */
export async function sendContactAction(_: FormState, form: FormData): Promise<FormState> {
  const raw = Object.fromEntries(
    ['name', 'email', 'phone', 'workType', 'desiredDate', 'message', 'website'].map((k) => [k, String(form.get(k) ?? '')]),
  );
  const parsed = contactMessageSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      error: 'Confira os campos destacados.',
      fieldErrors: Object.fromEntries(parsed.error.issues.map((i) => [String(i.path[0]), i.message])),
    };
  }
  try {
    const res = await fetch(`${API_URL}/public/contact`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(parsed.data),
      cache: 'no-store',
    });
    if (!res.ok) throw await ApiError.fromResponse(res);
  } catch (e) {
    if (e instanceof ApiError && e.status === 429) {
      return { error: 'Muitas mensagens em pouco tempo. Tente de novo em alguns minutos.' };
    }
    return { error: e instanceof ApiError ? e.message : 'Não foi possível enviar agora. Tente pelo WhatsApp.' };
  }
  return { success: 'ok' };
}
