'use client';

import type { CategoryDto, ProjectSummaryDto } from '@mf/shared';
import { ChevronDown, ChevronUp, Plus } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { DragHandleIcon } from '@/components/icons';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { api } from '@/lib/api/client';
import { cn } from '@/lib/utils';
import { PageHeader } from './admin-ui';
import { useMutation, useSortable } from './hooks';

/** Colunas da tabela e a partir de que largura cada uma aparece. */
const COLUMNS: [string, string][] = [
  ['Projeto', ''],
  ['Categoria', 'hidden lg:table-cell'],
  ['Fotos', 'hidden lg:table-cell'],
  ['Editado por', 'hidden lg:table-cell'],
  ['Status', 'hidden lg:table-cell'],
  ['Destaque', ''],
];

export function ProjectsTable({ projects, categories }: { projects: ProjectSummaryDto[]; categories: CategoryDto[] }) {
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const { attempt } = useMutation();
  const sortable = useSortable(projects, (ids) =>
    void attempt(() => api('/projects/order', { method: 'PUT', json: { ids } }), 'Ordem do portfólio salva'),
  );
  const rows = sortable.list.filter((p) => !categoryId || p.category.id === categoryId);
  const canSort = !categoryId;

  return (
    <>
      <PageHeader
        eyebrow="O que aparece no site"
        title="Portfólio"
        actions={
          <Button asChild>
            <Link href="/painel/portfolio/novo">
              <Plus className="size-4" strokeWidth={2} aria-hidden />
              Novo projeto
            </Link>
          </Button>
        }
      />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div role="group" aria-label="Filtrar por categoria" className="flex flex-wrap gap-2">
          {[{ id: null, name: 'Todas' }, ...categories].map((c) => (
            <Button key={c.id ?? 'all'} size="sm" variant={categoryId === c.id ? 'default' : 'outline'} aria-pressed={categoryId === c.id} onClick={() => setCategoryId(c.id)}>
              {c.name}
            </Button>
          ))}
        </div>
        <Link href="/painel/categorias" className="inline-flex min-h-9 items-center rounded-full border border-line px-3.5 text-[11px] font-semibold tracking-[0.14em] uppercase hover:border-chalk">
          Gerenciar categorias
        </Link>
      </div>
      <p className="text-sm text-fog">
        {canSort
          ? 'Arraste pela alça (ou use as setas) para reordenar. Projetos em destaque aparecem primeiro na página inicial.'
          : 'Para reordenar, volte ao filtro "Todas".'}
      </p>

      <div className="relative overflow-x-auto rounded-xl border border-line">
        <table className="w-full border-collapse text-sm lg:min-w-[900px]">
          <thead>
            <tr className="border-b border-line text-left">
              <th scope="col" className="w-12 px-2 py-3.5 sm:w-16 sm:px-4"><span className="sr-only">Ordem</span></th>
              {COLUMNS.map(([h, cls]) => (
                <th key={h} scope="col" className={cn('px-4 py-3.5 text-[11px] font-semibold tracking-label text-fog uppercase', cls)}>
                  {h}
                </th>
              ))}
              <th scope="col" className="hidden px-4 py-3.5 sm:table-cell"><span className="sr-only">Ações</span></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p, i) => (
              <tr
                key={p.id}
                {...(canSort ? sortable.itemProps(p.id) : {})}
                className="border-b border-line hover:bg-ink-2 data-[dragging]:opacity-50"
              >
                <td className="px-2 py-3 text-steel sm:px-4">
                  {canSort && (
                    <span className="flex items-center gap-1">
                      <DragHandleIcon className="cursor-grab" />
                      <span className="flex flex-col">
                        <button type="button" aria-label={`Subir ${p.title}`} disabled={i === 0} onClick={() => sortable.moveBy(p.id, -1)} className="text-fog hover:text-chalk disabled:opacity-30"><ChevronUp className="size-3.5" /></button>
                        <button type="button" aria-label={`Descer ${p.title}`} disabled={i === rows.length - 1} onClick={() => sortable.moveBy(p.id, 1)} className="text-fog hover:text-chalk disabled:opacity-30"><ChevronDown className="size-3.5" /></button>
                      </span>
                    </span>
                  )}
                </td>
                <td className="py-3 pr-2 sm:px-4">
                  <span className="flex items-center gap-3.5">
                    {p.coverThumbUrl ? (
                      <Image src={p.coverThumbUrl} alt="" width={72} height={52} className="hidden h-[52px] w-[72px] flex-none rounded-sm object-cover sm:block" />
                    ) : (
                      <span aria-hidden className="hidden h-[52px] w-[72px] flex-none rounded-sm border border-line bg-ink-3 sm:block" />
                    )}
                    <span className="flex flex-col items-start gap-1">
                      <Link href={`/painel/portfolio/${p.id}`} className="font-bold hover:underline">{p.title}</Link>
                      <span className="text-xs text-fog">{p.year ?? '—'}</span>
                      <span className="mt-1 flex flex-wrap gap-1.5 lg:hidden">
                        <Badge variant="outline">{p.category.name}</Badge>
                        <Badge variant={p.status === 'PUBLISHED' ? 'default' : 'outline'}>{p.status === 'PUBLISHED' ? 'Publicado' : 'Rascunho'}</Badge>
                      </span>
                    </span>
                  </span>
                </td>
                <td className="hidden px-4 py-3 lg:table-cell"><Badge variant="outline">{p.category.name}</Badge></td>
                <td className="hidden px-4 py-3 text-mist lg:table-cell">{p.photoCount}</td>
                <td className="hidden px-4 py-3 text-[13px] text-fog lg:table-cell">{p.updatedByName ?? '—'}</td>
                <td className="hidden px-4 py-3 lg:table-cell">
                  <Badge variant={p.status === 'PUBLISHED' ? 'default' : 'outline'}>{p.status === 'PUBLISHED' ? 'Publicado' : 'Rascunho'}</Badge>
                </td>
                <td className="px-2 py-3 sm:px-4">
                  <Switch
                    checked={p.featured}
                    aria-label={`Destacar ${p.title} na página inicial`}
                    onCheckedChange={(featured) =>
                      void attempt(() => api(`/projects/${p.id}/featured`, { method: 'PATCH', json: { featured } }), featured ? 'Projeto em destaque' : 'Destaque removido')
                    }
                  />
                </td>
                <td className="hidden px-4 py-3 text-right sm:table-cell">
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/painel/portfolio/${p.id}`}>Editar</Link>
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <p className={cn('px-4 py-8 text-center text-sm text-fog')}>Nenhum projeto aqui ainda.</p>}
      </div>
    </>
  );
}
