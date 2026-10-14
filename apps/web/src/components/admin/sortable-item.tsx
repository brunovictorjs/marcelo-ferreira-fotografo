'use client';

import { ChevronDown, ChevronUp } from 'lucide-react';
import type { ReactNode } from 'react';
import { DragHandleIcon } from '@/components/icons';
import { cn } from '@/lib/utils';

/** Item de lista selecionável e reordenável (categorias, serviços). */
export function SortableItem({
  selected,
  onSelect,
  title,
  subtitle,
  pill,
  dragProps,
  onMove,
  first,
  last,
}: {
  selected: boolean;
  onSelect: () => void;
  title: ReactNode;
  subtitle?: ReactNode;
  pill?: ReactNode;
  dragProps: object;
  onMove: (delta: number) => void;
  first: boolean;
  last: boolean;
}) {
  return (
    <li
      {...dragProps}
      className={cn(
        'flex items-center gap-2 rounded-xl border bg-ink p-2 pr-4 data-[dragging]:opacity-40',
        selected ? 'border-chalk bg-ink-3' : 'border-line hover:border-line-strong',
      )}
    >
      <span className="flex items-center text-steel">
        <DragHandleIcon className="cursor-grab" />
        <span className="flex flex-col">
          <button type="button" aria-label="Mover para cima" disabled={first} onClick={() => onMove(-1)} className="text-fog hover:text-chalk disabled:opacity-30"><ChevronUp className="size-3.5" /></button>
          <button type="button" aria-label="Mover para baixo" disabled={last} onClick={() => onMove(1)} className="text-fog hover:text-chalk disabled:opacity-30"><ChevronDown className="size-3.5" /></button>
        </span>
      </span>
      <button type="button" onClick={onSelect} aria-current={selected || undefined} className="flex min-h-12 flex-1 items-center justify-between gap-3 text-left">
        <span className="flex flex-col gap-1">
          <span className="text-sm font-bold">{title}</span>
          {subtitle && <span className="text-xs text-fog">{subtitle}</span>}
        </span>
        {pill}
      </button>
    </li>
  );
}
