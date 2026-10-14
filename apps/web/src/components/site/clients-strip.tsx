import type { ClientsSettings } from '@mf/shared';
import type { CSSProperties } from 'react';
import { Reveal } from '@/components/motion/reveal';
import { cn } from '@/lib/utils';

/** Segundos que cada logo leva para cruzar a faixa (define a velocidade do loop). */
const SECONDS_PER_LOGO = 4;

/**
 * Faixa de logos de clientes e publicações (nas cores originais), rolando em
 * loop contínuo. A lista é renderizada duas vezes lado a lado; cada cópia tem
 * no mínimo a largura da faixa, então nunca sobra buraco. Pausa com o mouse em
 * cima ou foco de teclado; fica parada para quem prefere movimento reduzido.
 */
export function ClientsStrip({ clients }: { clients: ClientsSettings }) {
  const logos = clients.logos.filter((l) => l.imageUrl);
  if (!clients.visible || logos.length === 0) return null;

  const style = {
    '--marquee-gap': '3rem',
    '--marquee-duration': `${Math.max(20, logos.length * SECONDS_PER_LOGO)}s`,
  } as CSSProperties;

  const list = (copy: boolean) => (
    <ul
      aria-hidden={copy || undefined}
      className={cn(
        'flex min-w-full shrink-0 animate-marquee items-center justify-around gap-(--marquee-gap) will-change-transform [backface-visibility:hidden] group-hover:[animation-play-state:paused] group-focus-within:[animation-play-state:paused]',
        'motion-reduce:animate-none motion-reduce:flex-wrap motion-reduce:justify-center motion-reduce:gap-y-6',
        copy && 'motion-reduce:hidden',
      )}
    >
      {logos.map((logo) => {
        const img = (
          // eslint-disable-next-line @next/next/no-img-element -- logos podem ser SVG enviados pelo painel
          <img
            src={logo.imageUrl!}
            alt={copy ? '' : logo.name}
            draggable={false}
            className="max-h-full max-w-full object-contain"
          />
        );
        return (
          // Caixa de tamanho fixo: a largura da faixa não muda quando as imagens carregam.
          <li key={logo.id} className="flex h-12 w-36 flex-none items-center justify-center">
            {logo.url ? (
              <a href={logo.url} target="_blank" rel="noopener noreferrer" aria-label={logo.name} tabIndex={copy ? -1 : undefined} className="flex size-full items-center justify-center">
                {img}
              </a>
            ) : (
              img
            )}
          </li>
        );
      })}
    </ul>
  );

  return (
    <section aria-label={clients.title} className="border-y border-line bg-ink-2">
      <Reveal className="section-container flex flex-wrap items-center gap-x-12 gap-y-6 py-8">
        <span data-reveal className="label-caps">
          {clients.title}
        </span>
        <div data-reveal style={style} className="group relative flex min-w-0 flex-[1_1_600px] gap-(--marquee-gap) overflow-hidden">
          {list(false)}
          {list(true)}
          {/* Esmaecimento nas bordas por cima (em vez de mask-image, que faz o Chrome redesenhar a camada animada) */}
          <span aria-hidden className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-ink-2 to-transparent motion-reduce:hidden" />
          <span aria-hidden className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-ink-2 to-transparent motion-reduce:hidden" />
        </div>
      </Reveal>
    </section>
  );
}
