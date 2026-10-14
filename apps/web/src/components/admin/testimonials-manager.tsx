'use client';

import { HOME_TESTIMONIALS_LIMIT, type ProjectSummaryDto, TESTIMONIAL_QUOTE_MAX, type TestimonialDto } from '@mf/shared';
import { ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';
import { Stars } from '@/components/site/stars';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { api } from '@/lib/api/client';
import { ApiError } from '@/lib/api/errors';
import { AdminCard, FormField, PageHeader } from './admin-ui';
import { ConfirmButton } from './confirm-button';
import { useMutation, useSortable } from './hooks';
import { ImagePicker } from './image-picker';

type Filter = 'all' | 'visible' | 'hidden';
const FILTERS: [Filter, string][] = [['all', 'Todos'], ['visible', 'No site'], ['hidden', 'Ocultos']];

interface Form {
  clientName: string;
  jobLabel: string;
  projectId: string;
  rating: number;
  quote: string;
  photoUrl: string | null;
  visible: boolean;
}

const toForm = (t?: TestimonialDto): Form => ({
  clientName: t?.clientName ?? '',
  jobLabel: t?.jobLabel ?? '',
  projectId: t?.project?.id ?? '',
  rating: t?.rating ?? 5,
  quote: t?.quote ?? '',
  photoUrl: t?.photoUrl ?? null,
  visible: t?.visible ?? true,
});

export function TestimonialsManager({ testimonials, projects }: { testimonials: TestimonialDto[]; projects: ProjectSummaryDto[] }) {
  const { run, attempt, busy } = useMutation();
  const [filter, setFilter] = useState<Filter>('all');
  /** null = fechado; 'new' = novo; id = editando */
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<Form>(toForm());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const sortable = useSortable(testimonials, (ids) => void attempt(() => api('/testimonials/order', { method: 'PUT', json: { ids } }), 'Ordem salva'));

  const open = (t?: TestimonialDto) => {
    setEditing(t?.id ?? 'new');
    setForm(toForm(t));
    setErrors({});
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    setErrors({});
    const isNew = editing === 'new';
    try {
      await run(
        () => api(isNew ? '/testimonials' : `/testimonials/${editing}`, { method: isNew ? 'POST' : 'PUT', json: { ...form, projectId: form.projectId || null } }),
        'Depoimento salvo',
      );
      setEditing(null);
    } catch (e) {
      if (e instanceof ApiError) setErrors(e.fieldErrors());
    }
  };

  const keep = (t: TestimonialDto) => filter === 'all' || (filter === 'visible' ? t.visible : !t.visible);
  const visibleRows = sortable.list.filter(keep);
  // Projetos que já têm depoimento de outro cliente não entram na lista.
  const taken = new Set(testimonials.filter((t) => t.id !== editing && t.project).map((t) => t.project!.id));
  const linkable = projects.filter((p) => !taken.has(p.id));

  return (
    <>
      <PageHeader eyebrow="Prova social" title="Depoimentos" actions={<Button onClick={() => open()}><Plus className="size-4" strokeWidth={2} aria-hidden />Novo depoimento</Button>} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div role="group" aria-label="Filtrar depoimentos" className="flex flex-wrap gap-2">
          {FILTERS.map(([k, l]) => (
            <Button key={k} size="sm" variant={filter === k ? 'default' : 'outline'} aria-pressed={filter === k} onClick={() => setFilter(k)}>{l}</Button>
          ))}
        </div>
        <span className="text-xs text-fog">O site mostra até {HOME_TESTIMONIALS_LIMIT} depoimentos no carrossel da página inicial, na ordem desta lista.</span>
      </div>

      {editing && (
        <AdminCard title={editing === 'new' ? 'Novo depoimento' : 'Editar depoimento'} className="border-line-strong">
          <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4">
            <FormField id="d-nome" label="Nome do cliente" error={errors.clientName}>
              <Input id="d-nome" placeholder="Nome e sobrenome" value={form.clientName} onChange={(e) => set('clientName', e.target.value)} />
            </FormField>
            <FormField id="d-tipo" label="Tipo de trabalho" error={errors.jobLabel}>
              <Input id="d-tipo" placeholder="Ex.: Casamento • 2026" value={form.jobLabel} onChange={(e) => set('jobLabel', e.target.value)} />
            </FormField>
            <FormField id="d-proj" label="Projeto vinculado">
              <select id="d-proj" className="field h-11.5 py-0 text-[15px]" value={form.projectId} onChange={(e) => set('projectId', e.target.value)}>
                <option value="">Nenhum</option>
                {linkable.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
              </select>
            </FormField>
            <FormField id="d-nota" label="Nota">
              <select id="d-nota" className="field h-11.5 py-0 text-[15px]" value={form.rating} onChange={(e) => set('rating', Number(e.target.value))}>
                {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} {n === 1 ? 'estrela' : 'estrelas'}</option>)}
              </select>
            </FormField>
          </div>
          <FormField id="d-texto" label="Depoimento" error={errors.quote} help={`${form.quote.length} de ${TESTIMONIAL_QUOTE_MAX} caracteres.`}>
            <Textarea id="d-texto" rows={3} maxLength={TESTIMONIAL_QUOTE_MAX} placeholder="Cole aqui o que o cliente escreveu." value={form.quote} onChange={(e) => set('quote', e.target.value)} />
          </FormField>
          <div className="flex flex-wrap items-center gap-4">
            {form.photoUrl ? (
              <Image src={form.photoUrl} alt="Foto do cliente" width={48} height={48} className="size-12 rounded-full object-cover" />
            ) : (
              <span aria-hidden className="size-12 rounded-full border border-line bg-ink-3" />
            )}
            <ImagePicker folder="testimonials" label={form.photoUrl ? 'Trocar foto do cliente' : 'Foto do cliente (opcional)'} onUploaded={(url) => set('photoUrl', url)} />
            {form.photoUrl && <Button size="sm" variant="ghost" onClick={() => set('photoUrl', null)}>Remover foto</Button>}
            <span className="ml-auto flex items-center gap-2.5 text-[13px] text-fog">
              Mostrar no site
              <Switch checked={form.visible} onCheckedChange={(v) => set('visible', v)} aria-label="Mostrar no site" />
            </span>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setEditing(null)}>Cancelar</Button>
            <Button disabled={busy} onClick={() => void save()}>Salvar depoimento</Button>
          </div>
        </AdminCard>
      )}

      <ul className="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-4">
        {visibleRows.map((t) => {
          const i = sortable.list.indexOf(t);
          return (
            <li key={t.id} {...(filter === 'all' ? sortable.itemProps(t.id) : {})} className="flex flex-col gap-4 rounded-xl border border-line bg-ink p-6 data-[dragging]:opacity-40">
              <div className="flex items-center justify-between gap-3">
                <Stars rating={t.rating} />
                <span className="flex items-center gap-2.5 text-xs text-fog">
                  No site
                  <Switch
                    checked={t.visible}
                    aria-label={`Mostrar depoimento de ${t.clientName} no site`}
                    onCheckedChange={(visible) => void attempt(() => api(`/testimonials/${t.id}/visibility`, { method: 'PATCH', json: { visible } }), visible ? 'Depoimento no site' : 'Depoimento oculto')}
                  />
                </span>
              </div>
              <p className="text-[15px] leading-6">“{t.quote}”</p>
              <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
                <span className="flex flex-col gap-0.5">
                  <span className="text-sm font-bold">{t.clientName}</span>
                  <span className="text-xs text-fog">{[t.jobLabel, t.project?.title ?? 'Sem projeto vinculado'].filter(Boolean).join(' • ')}</span>
                </span>
                <span className="flex gap-2">
                  {filter === 'all' && (
                    <>
                      <Button size="icon" variant="ghost" aria-label="Mover para cima" disabled={i === 0} onClick={() => sortable.moveBy(t.id, -1)}><ChevronUp className="size-4" /></Button>
                      <Button size="icon" variant="ghost" aria-label="Mover para baixo" disabled={i === sortable.list.length - 1} onClick={() => sortable.moveBy(t.id, 1)}><ChevronDown className="size-4" /></Button>
                    </>
                  )}
                  <Button size="sm" variant="outline" onClick={() => open(t)}>Editar</Button>
                  <ConfirmButton
                    trigger={<Button size="icon" variant="ghost" aria-label={`Excluir depoimento de ${t.clientName}`}><Trash2 className="size-4" strokeWidth={1.5} /></Button>}
                    title="Excluir depoimento?"
                    description={`O depoimento de ${t.clientName} sai do site e do painel.`}
                    onConfirm={() => attempt(() => api(`/testimonials/${t.id}`, { method: 'DELETE' }), 'Depoimento excluído')}
                  />
                </span>
              </div>
            </li>
          );
        })}
      </ul>
      {visibleRows.length === 0 && <p className="text-sm text-fog">Nenhum depoimento neste filtro.</p>}
    </>
  );
}
