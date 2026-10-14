'use client';

import type { PhotoDto } from '@mf/shared';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import Image from 'next/image';
import { createContext, type ReactNode, use, useCallback, useEffect, useRef, useState } from 'react';
import { gsap, MOTION } from '@/components/motion/gsap';
import { cn } from '@/lib/utils';

const LightboxContext = createContext<((index: number) => void) | null>(null);

/** Abre a foto `index` da galeria em tela cheia. */
export function OpenPhotoButton({
  index,
  label,
  className,
  children,
}: {
  index: number;
  label: string;
  className?: string;
  children: ReactNode;
}) {
  const open = use(LightboxContext);
  return (
    <button type="button" onClick={() => open?.(index)} aria-label={label} className={cn('block w-full cursor-zoom-in', className)}>
      {children}
    </button>
  );
}

/**
 * Visualizador em tela cheia: setas do teclado, Esc para fechar, foco preso
 * no diálogo e transição GSAP entre as fotos.
 */
export function LightboxProvider({ photos, children }: { photos: PhotoDto[]; children: ReactNode }) {
  const [index, setIndex] = useState<number | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const total = photos.length;

  const open = useCallback(
    (i: number) => {
      if (!total) return;
      returnFocus.current = document.activeElement as HTMLElement;
      setIndex(i);
    },
    [total],
  );
  const close = useCallback(() => {
    setIndex(null);
    returnFocus.current?.focus();
  }, []);
  const step = useCallback((d: number) => setIndex((i) => (i === null ? i : (i + d + total) % total)), [total]);

  useEffect(() => {
    if (index === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowRight') step(1);
      if (e.key === 'ArrowLeft') step(-1);
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [index, close, step]);

  // Entrada do diálogo.
  const isOpen = index !== null;
  useEffect(() => {
    if (!isOpen || !dialogRef.current) return;
    dialogRef.current.querySelector<HTMLButtonElement>('[data-close]')?.focus();
    if (window.matchMedia(MOTION.ok).matches) gsap.from(dialogRef.current, { autoAlpha: 0, duration: 0.35, ease: 'power2.out' });
  }, [isOpen]);

  // Troca de foto.
  useEffect(() => {
    if (index === null || !imageRef.current || !window.matchMedia(MOTION.ok).matches) return;
    gsap.fromTo(imageRef.current, { autoAlpha: 0, scale: 0.97 }, { autoAlpha: 1, scale: 1, duration: 0.5 });
  }, [index]);

  const current = index !== null ? photos[index] : null;

  return (
    <LightboxContext value={open}>
      {children}
      {current && (
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-label="Visualização da foto"
          className="fixed inset-0 z-50 flex flex-col bg-[rgba(5,5,5,0.97)] p-4 sm:p-6"
          onClick={(e) => e.target === e.currentTarget && close()}
        >
          <div className="flex items-center justify-between gap-4">
            <span className="label-caps">
              {String(index! + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
            </span>
            <button
              data-close
              type="button"
              onClick={close}
              aria-label="Fechar"
              className="flex size-12 items-center justify-center rounded-full border border-line-strong hover:border-chalk"
            >
              <X className="size-5" strokeWidth={1.5} />
            </button>
          </div>
          <div className="flex min-h-0 flex-1 items-center gap-4 py-6">
            <button
              type="button"
              onClick={() => step(-1)}
              aria-label="Foto anterior"
              className="hidden size-14 flex-none items-center justify-center rounded-full border border-line-strong hover:border-chalk sm:flex"
            >
              <ChevronLeft className="size-5" strokeWidth={1.5} />
            </button>
            <div ref={imageRef} className="relative h-full min-h-60 flex-1">
              <Image src={current.url} alt={current.caption ?? `Foto ${index! + 1}`} fill sizes="100vw" className="object-contain" />
            </div>
            <button
              type="button"
              onClick={() => step(1)}
              aria-label="Próxima foto"
              className="hidden size-14 flex-none items-center justify-center rounded-full border border-line-strong hover:border-chalk sm:flex"
            >
              <ChevronRight className="size-5" strokeWidth={1.5} />
            </button>
          </div>
          <div className="flex items-center justify-between gap-4 sm:justify-center">
            <button type="button" onClick={() => step(-1)} aria-label="Foto anterior" className="flex size-12 items-center justify-center rounded-full border border-line-strong sm:hidden">
              <ChevronLeft className="size-5" strokeWidth={1.5} />
            </button>
            <p className="text-center text-[15px] text-mist">{current.caption}</p>
            <button type="button" onClick={() => step(1)} aria-label="Próxima foto" className="flex size-12 items-center justify-center rounded-full border border-line-strong sm:hidden">
              <ChevronRight className="size-5" strokeWidth={1.5} />
            </button>
          </div>
        </div>
      )}
    </LightboxContext>
  );
}
