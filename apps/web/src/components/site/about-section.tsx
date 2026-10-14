import type { AboutSettings } from '@mf/shared';
import Image from 'next/image';
import { Reveal } from '@/components/motion/reveal';
import { DEFAULT_IMAGES } from '@/lib/config';

/** "Sobre mim" no tema prata. Linhas em branco do texto viram parágrafos. */
export function AboutSection({ about }: { about: AboutSettings }) {
  const paragraphs = about.text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  const chips = [...(about.since ? [`Fotografando desde ${about.since}`] : []), ...about.chips];

  return (
    <section id="sobre" className="scroll-mt-20 bg-silver text-coal">
      {/* Lado a lado no desktop. Empilhado (celular/tablet), a foto vai para o fim:
          a base dela encosta no fim da seção, como no desktop, em vez de flutuar no topo. */}
      <Reveal className="section-container flex flex-col gap-12 pt-24 lg:flex-row lg:items-end lg:gap-16">
        <div data-reveal className="order-last flex min-w-0 items-end lg:order-none lg:flex-[1_1_440px]">
          <Image
            src={about.imageUrl ?? DEFAULT_IMAGES.about}
            alt="Marcelo Ferreira fotografando com sua câmera"
            width={1000}
            height={1149}
            sizes="(min-width: 1024px) 580px, 100vw"
            className="mx-auto h-auto w-full max-w-[420px] grayscale contrast-[1.05] sm:max-w-[480px] lg:max-w-[580px]"
          />
        </div>
        <div className="flex min-w-0 flex-col gap-6 lg:flex-[1_1_480px] lg:pb-24">
          <span data-reveal className="text-xs font-semibold tracking-label text-graphite uppercase">
            03 — Sobre mim
          </span>
          <h2 data-reveal className="font-display text-[clamp(56px,7vw,88px)] leading-[0.9] font-bold uppercase">
            Marcelo
            <br />
            Ferreira
          </h2>
          {about.opening && (
            <p data-reveal className="text-lg leading-7 font-medium">
              {about.opening}
            </p>
          )}
          {paragraphs.map((p) => (
            <p data-reveal key={p.slice(0, 40)} className="leading-[26px] text-graphite">
              {p}
            </p>
          ))}
          {chips.length > 0 && (
            <ul data-reveal className="flex flex-wrap gap-3">
              {chips.map((chip, i) => (
                <li
                  key={i}
                  className="rounded-full bg-coal px-4 py-2.5 text-xs font-semibold tracking-[0.12em] text-chalk uppercase"
                >
                  {chip}
                </li>
              ))}
            </ul>
          )}
          {about.signature && (
            <span data-reveal className="mt-2 -rotate-4 self-start font-script text-5xl leading-none text-ink-2">
              {about.signature}
            </span>
          )}
        </div>
      </Reveal>
    </section>
  );
}
