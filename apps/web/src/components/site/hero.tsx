'use client';

import type { HeroSettings } from '@mf/shared';
import Image from 'next/image';
import { useRef } from 'react';
import { gsap, MOTION, useGSAP } from '@/components/motion/gsap';
import { DEFAULT_IMAGES } from '@/lib/config';

/**
 * Abertura do site. Animação de entrada: linhas do título sobem por trás de
 * uma máscara, a assinatura "escreve" da esquerda para a direita, a foto
 * desliza e o cromado da linha 2 ganha um brilho que percorre o texto.
 */
export function Hero({ hero }: { hero: HeroSettings }) {
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION.ok, () => {
        const tl = gsap.timeline({ defaults: { ease: 'expo.out', duration: 1.2 } });
        tl.from('[data-hero="kicker"]', { autoAlpha: 0, letterSpacing: '0.8em', duration: 1.4 })
          .from('[data-hero="line"]', { yPercent: 110, stagger: 0.12 }, '<0.1')
          .fromTo(
            '[data-hero="script"]',
            { clipPath: 'inset(0 100% 0 0)' },
            { clipPath: 'inset(0 0% 0 0)', duration: 1.4, ease: 'power2.inOut' },
            '<0.4',
          )
          .from('[data-hero="fade"]', { autoAlpha: 0, y: 24, stagger: 0.1, duration: 0.9 }, '<0.2')
          .from('[data-hero="photo"]', { autoAlpha: 0, x: 60, scale: 1.04, duration: 1.6 }, 0.2)
          .fromTo('.text-chrome', { backgroundPosition: '0% 100%' }, { backgroundPosition: '0% 0%', duration: 2.2, ease: 'sine.inOut' }, 0.6);

        // Parallax suave da foto ao rolar.
        gsap.to('[data-hero="photo"]', {
          yPercent: 8,
          ease: 'none',
          scrollTrigger: { trigger: ref.current, start: 'top top', end: 'bottom top', scrub: true },
        });
      });
      return () => mm.revert();
    },
    { scope: ref },
  );

  return (
    <section
      ref={ref}
      id="inicio"
      className="section-container relative flex flex-wrap items-end gap-8 overflow-hidden pt-16 lg:min-h-[760px]"
    >
      <div className="relative z-10 flex min-w-0 flex-[0_1_600px] flex-col gap-8 pb-12 lg:pb-24">
        <div className="flex flex-col gap-2">
          <span data-hero="kicker" className="text-lg font-medium tracking-wide-label text-fog uppercase">
            {hero.kicker}
          </span>
          <h1 className="text-[clamp(52px,7vw,104px)] leading-[0.95] font-extrabold tracking-[-0.01em] uppercase">
            <span className="block overflow-hidden pb-1">
              <span data-hero="line" className="block">
                {hero.line1}
              </span>
            </span>
            <span className="block overflow-hidden pb-1">
              <span data-hero="line" className="text-chrome block">
                {hero.line2}
              </span>
            </span>
          </h1>
          {hero.script && (
            <span data-hero="script" className="mt-1 font-script text-[clamp(40px,4vw,52px)] leading-none text-mist">
              {hero.script}
            </span>
          )}
        </div>
        <p data-hero="fade" className="max-w-[480px] text-lg leading-7 text-fog">
          {hero.text}
        </p>
        <div data-hero="fade" className="flex flex-wrap gap-4">
          <a
            href="#contato"
            className="inline-flex min-h-13 items-center rounded-sm bg-chalk px-7 text-sm font-bold tracking-[0.08em] text-ink uppercase transition-colors hover:bg-mist"
          >
            {hero.primaryButton}
          </a>
          <a
            href="#portfolio"
            className="inline-flex min-h-13 items-center rounded-sm border-2 border-line-strong px-7 text-sm font-bold tracking-[0.08em] uppercase transition-colors hover:border-chalk"
          >
            {hero.secondaryButton}
          </a>
        </div>
        <div data-hero="fade" className="flex flex-wrap items-center gap-3 text-xs font-semibold tracking-label text-fog uppercase">
          {hero.since && (
            <>
              <span aria-hidden className="h-px w-6 bg-fog" />
              Desde {hero.since}
              <span aria-hidden className="mr-3 h-px w-6 bg-fog" />
            </>
          )}
          <span>{hero.tagline}</span>
        </div>
      </div>

      <div
        data-hero="photo"
        className="pointer-events-none w-full self-end lg:absolute lg:right-12 lg:bottom-0 lg:h-[calc(100%-100px)] lg:w-[58%]"
      >
        <Image
          src={hero.imageUrl ?? DEFAULT_IMAGES.hero}
          alt="Marcelo Ferreira sentado à mesa com sua câmera"
          width={1000}
          height={900}
          priority
          sizes="(min-width: 1024px) 58vw, 100vw"
          className="h-auto w-full object-contain object-bottom grayscale contrast-[1.08] lg:h-full lg:object-right-bottom"
        />
      </div>
    </section>
  );
}
