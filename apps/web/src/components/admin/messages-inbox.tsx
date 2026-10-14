'use client';

import type { MessageDto, MessageFilter, MessageListDto } from '@mf/shared';
import { Mail } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api/client';
import { cn } from '@/lib/utils';
import { PageHeader } from './admin-ui';
import { ConfirmButton } from './confirm-button';
import { useMutation } from './hooks';

const FILTERS: [MessageFilter, string][] = [
  ['all', 'Todas'],
  ['pending', 'Aguardando resposta'],
  ['answered', 'Respondidas'],
];

function when(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const time = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const days = Math.floor((new Date(now.toDateString()).getTime() - new Date(d.toDateString()).getTime()) / 86_400_000);
  if (days === 0) return `hoje, ${time}`;
  if (days === 1) return `ontem, ${time}`;
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

const formatDesired = (v: string | null) => {
  if (!v) return 'A combinar';
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : v;
};

const whatsappUrl = (m: MessageDto) => {
  const digits = (m.phone ?? '').replace(/\D/g, '');
  if (!digits) return null;
  const text = encodeURIComponent(`Olá, ${m.name.split(' ')[0]}! Aqui é o Marcelo Ferreira, recebi sua mensagem pelo site.`);
  return `https://wa.me/${digits.length <= 11 ? `55${digits}` : digits}?text=${text}`;
};

export function MessagesInbox({ initial }: { initial: MessageListDto }) {
  const [filter, setFilter] = useState<MessageFilter>('all');
  const [data, setData] = useState(initial);
  const [selectedId, setSelectedId] = useState<string | null>(initial.items[0]?.id ?? null);
  const { attempt, busy } = useMutation();

  const reload = async (f = filter) => {
    const next = await api<MessageListDto>(`/messages?filter=${f}`);
    setData(next);
    return next;
  };

  const pickFilter = async (f: MessageFilter) => {
    setFilter(f);
    const next = await attempt(() => reload(f));
    if (next && !next.items.some((m) => m.id === selectedId)) setSelectedId(next.items[0]?.id ?? null);
  };

  const select = async (m: MessageDto) => {
    setSelectedId(m.id);
    if (!m.read) await attempt(async () => { await api(`/messages/${m.id}/read`, { method: 'POST' }); await reload(); });
  };

  const sel = data.items.find((m) => m.id === selectedId) ?? null;

  return (
    <>
      <PageHeader
        eyebrow="Contatos do site"
        title="Mensagens"
        actions={
          <span className="inline-flex items-center gap-2 text-[13px] text-fog">
            <Mail className="size-4" strokeWidth={1.5} aria-hidden />
            Cada nova mensagem também chega no e-mail definido em Configurações › Contato
          </span>
        }
      />

      <div role="group" aria-label="Filtrar mensagens" className="flex flex-wrap gap-2">
        {FILTERS.map(([key, label]) => (
          <Button key={key} size="sm" variant={filter === key ? 'default' : 'outline'} aria-pressed={filter === key} onClick={() => void pickFilter(key)}>
            {label}
          </Button>
        ))}
      </div>

      <div className="flex min-h-[620px] flex-wrap overflow-hidden rounded-xl border border-line">
        <div className="min-w-0 flex-[1_1_320px] border-line bg-ink md:border-r">
          <div className="flex items-center justify-between border-b border-line px-4 py-3.5">
            <span className="text-[11px] font-semibold tracking-label text-fog uppercase">Caixa de entrada</span>
            <span className="text-xs text-fog">{data.unreadCount} não lidas</span>
          </div>
          {data.items.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => void select(m)}
              aria-current={m.id === selectedId ? 'true' : undefined}
              className={cn(
                'flex w-full flex-col gap-1.5 border-b border-line p-4 text-left hover:bg-ink-3',
                m.id === selectedId && 'bg-ink-3 shadow-[inset_3px_0_0_#f2f2f2]',
              )}
            >
              <span className="flex w-full items-center justify-between gap-2">
                <span className="flex items-center gap-2.5 text-sm font-bold">
                  <span aria-hidden className={cn('size-2 flex-none rounded-full', m.read ? 'border border-steel' : 'bg-chalk')} />
                  {m.name}
                  {!m.read && <span className="sr-only">(não lida)</span>}
                </span>
                <span className="text-xs text-fog">{when(m.createdAt)}</span>
              </span>
              <span className="pl-[18px] text-[11px] font-semibold tracking-[0.14em] text-mist uppercase">{m.workType}</span>
              <span className="line-clamp-2 pl-[18px] text-[13px] leading-[19px] text-fog">{m.message}</span>
            </button>
          ))}
          {data.items.length === 0 && <p className="px-4 py-6 text-sm text-fog">Nenhuma mensagem neste filtro.</p>}
        </div>

        <article className="flex min-w-0 flex-[999_1_420px] flex-col gap-6 bg-ink-2 p-6 sm:p-8">
          {sel ? (
            <>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex flex-col gap-2">
                  <span className="text-[11px] font-semibold tracking-label text-fog uppercase">{sel.workType}</span>
                  <h2 className="text-[28px] leading-[34px] font-extrabold">{sel.name}</h2>
                  <span className="text-[13px] text-fog">Recebida {when(sel.createdAt)} pelo formulário do site</span>
                </div>
                <Badge variant={sel.answered ? 'default' : 'outline'}>{sel.answered ? 'Respondida' : 'Aguardando resposta'}</Badge>
              </div>
              <dl className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-4 rounded-xl border border-line bg-ink p-5">
                {[
                  ['E-mail', sel.email],
                  ['WhatsApp', sel.phone ?? '—'],
                  ['Data desejada', formatDesired(sel.desiredDate)],
                ].map(([label, value]) => (
                  <div key={label} className="flex flex-col gap-1">
                    <dt className="text-[11px] font-semibold tracking-label text-fog uppercase">{label}</dt>
                    <dd className="text-sm font-semibold [overflow-wrap:anywhere]">{value}</dd>
                  </div>
                ))}
              </dl>
              <div className="flex flex-col gap-2">
                <span className="text-[11px] font-semibold tracking-label text-fog uppercase">Mensagem</span>
                <p className="leading-[26px] whitespace-pre-line">{sel.message}</p>
              </div>
              {sel.answered && sel.answeredByName && <p className="text-[13px] text-fog">Respondida por {sel.answeredByName}.</p>}
              <div className="mt-auto flex flex-wrap gap-3 border-t border-line pt-6">
                <Button asChild>
                  <a href={`mailto:${sel.email}?subject=${encodeURIComponent('Re: seu contato — Marcelo Ferreira Fotografia')}`}>Responder por e-mail</a>
                </Button>
                {whatsappUrl(sel) && (
                  <Button asChild variant="outline">
                    <a href={whatsappUrl(sel)!} target="_blank" rel="noopener noreferrer">
                      Abrir no WhatsApp
                    </a>
                  </Button>
                )}
                <Button
                  variant="outline"
                  disabled={busy}
                  onClick={() =>
                    void attempt(async () => {
                      await api(`/messages/${sel.id}/answered`, { method: 'PATCH', json: { answered: !sel.answered } });
                      await reload();
                    }, sel.answered ? 'Marcada como pendente' : 'Marcada como respondida')
                  }
                >
                  {sel.answered ? 'Marcar como pendente' : 'Marcar como respondida'}
                </Button>
                <ConfirmButton
                  trigger={<Button variant="outline">Arquivar</Button>}
                  title="Arquivar mensagem?"
                  description={`A mensagem de ${sel.name} sai da caixa de entrada.`}
                  confirmLabel="Arquivar"
                  onConfirm={() =>
                    attempt(async () => {
                      await api(`/messages/${sel.id}/archive`, { method: 'POST' });
                      const next = await reload();
                      setSelectedId(next.items[0]?.id ?? null);
                    }, 'Mensagem arquivada')
                  }
                />
              </div>
            </>
          ) : (
            <p className="m-auto text-sm text-fog">Nenhuma mensagem selecionada.</p>
          )}
        </article>
      </div>
    </>
  );
}
