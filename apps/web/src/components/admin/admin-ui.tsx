import type { ReactNode } from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export function PageHeader({ eyebrow, title, actions }: { eyebrow: string; title: ReactNode; actions?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="flex flex-col gap-1.5">
        <span className="label-caps text-[11px]">{eyebrow}</span>
        <h1 className="text-4xl leading-10 font-extrabold">{title}</h1>
      </div>
      {actions && <div className="flex flex-wrap gap-3">{actions}</div>}
    </div>
  );
}

export function AdminCard({
  title,
  description,
  aside,
  className,
  children,
  id,
}: {
  title?: ReactNode;
  description?: ReactNode;
  aside?: ReactNode;
  className?: string;
  children: ReactNode;
  id?: string;
}) {
  return (
    <section id={id} className={cn('flex scroll-mt-6 flex-col gap-4.5 rounded-xl border border-line bg-ink-2 p-4 sm:p-6', className)}>
      {(title || aside) && (
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            {title && <h2 className="text-lg font-extrabold">{title}</h2>}
            {description && <p className="text-[13px] leading-5 text-fog">{description}</p>}
          </div>
          {aside}
        </div>
      )}
      {children}
    </section>
  );
}

/** Rótulo + campo + ajuda/erro, no padrão do protótipo. */
export function FormField({
  id,
  label,
  help,
  error,
  className,
  children,
}: {
  id: string;
  label: ReactNode;
  help?: ReactNode;
  error?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <label htmlFor={id} className="text-[11px] leading-4 font-semibold tracking-label text-fog uppercase">
        {label}
      </label>
      {children}
      {error ? (
        <span className="text-xs text-[#ff8a80]">{error}</span>
      ) : (
        help && <span className="text-xs leading-[18px] text-fog">{help}</span>
      )}
    </div>
  );
}

export function StatusPill({ on, children }: { on: boolean; children: ReactNode }) {
  return <Badge variant={on ? 'default' : 'outline'}>{children}</Badge>;
}

/** Linha "texto + interruptor" usada em vários formulários. */
export function SwitchRow({ title, help, children }: { title: ReactNode; help?: ReactNode; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="flex flex-col gap-0.5">
        <span className="text-sm font-bold">{title}</span>
        {help && <span className="text-xs text-fog">{help}</span>}
      </span>
      {children}
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="flex animate-pulse flex-col gap-6" aria-busy="true" aria-label="Carregando">
      <div className="h-3 w-40 rounded-sm bg-ink-3" />
      <div className="h-9 w-64 rounded-sm bg-ink-3" />
      <div className="h-[420px] rounded-xl border border-line bg-ink-2" />
    </div>
  );
}
