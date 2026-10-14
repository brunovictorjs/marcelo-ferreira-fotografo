'use client';

import { type ElementType, type ReactNode, useRef } from 'react';
import { gsap, MOTION, ScrollTrigger, useGSAP } from './gsap';

interface RevealProps {
  children: ReactNode;
  as?: ElementType;
  className?: string;
  id?: string;
  /** Atraso entre os itens marcados com data-reveal. */
  stagger?: number;
  'aria-label'?: string;
}

/**
 * Revela os filhos marcados com `data-reveal` quando a seção entra na tela
 * (sobe 40px e aparece, em cascata). Sem movimento para quem prefere reduzido.
 */
export function Reveal({ children, as: Tag = 'div', className, stagger = 0.1, ...rest }: RevealProps) {
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION.ok, () => {
        const items = gsap.utils.toArray<HTMLElement>('[data-reveal]', ref.current);
        if (!items.length) return;
        gsap.set(items, { autoAlpha: 0, y: 40 });
        ScrollTrigger.batch(items, {
          start: 'top 88%',
          once: true,
          onEnter: (batch) => gsap.to(batch, { autoAlpha: 1, y: 0, stagger, overwrite: true }),
        });
      });
      return () => mm.revert();
    },
    { scope: ref },
  );

  return (
    <Tag ref={ref} className={className} {...rest}>
      {children}
    </Tag>
  );
}
