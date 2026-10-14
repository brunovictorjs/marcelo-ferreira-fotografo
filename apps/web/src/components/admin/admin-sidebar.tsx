'use client';

import { Menu, X } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { type ReactNode, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

/**
 * Barra lateral do painel. No desktop (lg+) fica fixa à esquerda; no celular e
 * no tablet vira uma gaveta aberta pelo botão de menu da barra superior.
 */
export function AdminSidebar({ brand, children }: { brand: ReactNode; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Fecha ao navegar para outra seção.
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = overflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <>
      <div className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-line bg-ink-2/95 px-4 backdrop-blur-sm sm:px-8 lg:hidden">
        {brand}
        <button
          type="button"
          aria-label="Abrir menu do painel"
          aria-expanded={open}
          aria-controls="painel-menu"
          onClick={() => setOpen(true)}
          className="flex size-11 items-center justify-center rounded-sm border border-line hover:border-chalk"
        >
          <Menu className="size-5" strokeWidth={1.5} />
        </button>
      </div>

      <div
        aria-hidden
        onClick={() => setOpen(false)}
        className={cn(
          'fixed inset-0 z-40 bg-black/60 transition-opacity duration-300 lg:hidden',
          open ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
      />

      <aside
        id="painel-menu"
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-[min(300px,85vw)] flex-col gap-5 overflow-y-auto border-r border-line bg-ink-2 px-4 py-6 transition-[translate,visibility] duration-300',
          'lg:visible lg:sticky lg:top-0 lg:z-auto lg:h-dvh lg:w-[264px] lg:flex-none lg:translate-x-0',
          open ? 'visible translate-x-0' : 'invisible -translate-x-full',
        )}
      >
        <div className="flex items-start justify-between gap-3">
          {brand}
          <button
            type="button"
            aria-label="Fechar menu do painel"
            onClick={() => setOpen(false)}
            className="flex size-11 flex-none items-center justify-center rounded-sm border border-line hover:border-chalk lg:hidden"
          >
            <X className="size-5" strokeWidth={1.5} />
          </button>
        </div>
        {children}
      </aside>
    </>
  );
}
