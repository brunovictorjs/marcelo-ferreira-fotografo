'use client';

import type { UploadedImageDto } from '@mf/shared';
import { useRouter } from 'next/navigation';
import { useCallback, useState, useTransition } from 'react';
import { toast } from 'sonner';
import { api } from '@/lib/api/client';
import { ApiError, errorMessage } from '@/lib/api/errors';

/**
 * Executa uma alteração no painel: mostra o aviso (toast) do protótipo,
 * trata erros da API e recarrega os dados do servidor.
 */
export function useMutation() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [, startTransition] = useTransition();

  const run = useCallback(
    async <T,>(fn: () => Promise<T>, success?: string): Promise<T | undefined> => {
      setBusy(true);
      try {
        const result = await fn();
        if (success) toast.success(success);
        startTransition(() => router.refresh());
        return result;
      } catch (e) {
        toast.error(errorMessage(e));
        if (e instanceof ApiError) throw e;
        return undefined;
      } finally {
        setBusy(false);
      }
    },
    [router],
  );

  /** Igual a `run`, mas engole o erro (o toast já informou). */
  const attempt = useCallback(
    async <T,>(fn: () => Promise<T>, success?: string) => {
      try {
        return await run(fn, success);
      } catch {
        return undefined;
      }
    },
    [run],
  );

  return { run, attempt, busy };
}

export function uploadImage(file: File, folder: 'site' | 'logos' | 'testimonials') {
  const form = new FormData();
  form.append('file', file);
  return api<UploadedImageDto>(`/media/images?folder=${folder}`, { method: 'POST', form });
}

/** Move o item `from` para a posição `to` (imutável). */
export function move<T>(list: T[], from: number, to: number): T[] {
  const next = list.slice();
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item!);
  return next;
}

/**
 * Reordenação por arrastar (HTML5 drag & drop) para listas pequenas.
 * Devolve props para cada item; `onCommit` recebe a nova ordem de ids.
 */
export function useSortable<T extends { id: string }>(items: T[], onCommit: (ids: string[]) => void) {
  const [order, setOrder] = useState<T[] | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  // Dados novos do servidor (router.refresh) substituem a ordem local.
  const [source, setSource] = useState(items);
  if (source !== items) {
    setSource(items);
    setOrder(null);
  }
  const list = order ?? items;

  const itemProps = (id: string) => ({
    draggable: true,
    'data-dragging': dragId === id || undefined,
    onDragStart: (e: React.DragEvent) => {
      setDragId(id);
      setOrder(items);
      e.dataTransfer.effectAllowed = 'move';
    },
    onDragOver: (e: React.DragEvent) => {
      e.preventDefault();
      if (!dragId || dragId === id) return;
      setOrder((cur) => {
        const l = cur ?? items;
        return move(l, l.findIndex((x) => x.id === dragId), l.findIndex((x) => x.id === id));
      });
    },
    onDragEnd: () => {
      const ids = list.map((x) => x.id);
      const changed = ids.some((x, i) => x !== items[i]?.id);
      setDragId(null);
      if (changed) onCommit(ids);
      else setOrder(null);
    },
  });

  /** Alternativa acessível ao arrastar: mover com botões ↑ ↓. */
  const moveBy = (id: string, delta: number) => {
    const from = list.findIndex((x) => x.id === id);
    const to = from + delta;
    if (to < 0 || to >= list.length) return;
    const next = move(list, from, to);
    setOrder(next);
    onCommit(next.map((x) => x.id));
  };

  return { list, itemProps, moveBy, reset: () => setOrder(null) };
}
