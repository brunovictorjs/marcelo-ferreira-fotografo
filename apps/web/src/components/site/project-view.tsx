import type { ProjectDetailDto } from '@mf/shared';
import { ArrowRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Reveal } from '@/components/motion/reveal';
import { cn } from '@/lib/utils';
import { LightboxProvider, OpenPhotoButton } from './lightbox';
import { PhotoPlaceholder } from './photo-placeholder';

/** Ritmo da galeria do protótipo, repetido a cada 8 fotos. */
const LAYOUT = [
  { span: 'md:col-span-12', ratio: 'aspect-[16/7]' },
  { span: 'md:col-span-6', ratio: 'aspect-[4/5]' },
  { span: 'md:col-span-6', ratio: 'aspect-[4/5]' },
  { span: 'md:col-span-4', ratio: 'aspect-[3/4]' },
  { span: 'md:col-span-4', ratio: 'aspect-[3/4]' },
  { span: 'md:col-span-4', ratio: 'aspect-[3/4]' },
  { span: 'md:col-span-7', ratio: 'aspect-[4/3]' },
  { span: 'md:col-span-5', ratio: 'aspect-[3/4.2]' },
];

const formatDate = (iso: string | null) => {
  if (!iso) return null;
  const [y, m, d] = iso.split('-');
  return d && m && y ? `${d}/${m}/${y}` : iso;
};

/**
 * Página de um projeto. Usada no site público e na pré-visualização do painel
 * (por isso não busca dados: recebe o projeto pronto).
 */
export function ProjectView({ project, next }: { project: ProjectDetailDto; next: { slug: string; title: string } | null }) {
  const cover = project.photos.find((p) => p.id === project.coverPhotoId) ?? project.photos[0];
  const coverIndex = cover ? project.photos.indexOf(cover) : 0;
  const facts = [
    ['Cliente', project.client],
    ['Serviço', project.service?.name],
    ['Data', formatDate(project.date)],
    ['Local', project.location],
    ['Entrega', project.delivery],
    ['Equipe', project.team],
  ].filter((f): f is [string, string] => !!f[1]);
  const story = [
    ['01', 'O desafio', project.challenge],
    ['02', 'A abordagem', project.approach],
    ['03', 'O resultado', project.result],
  ].filter((s): s is [string, string, string] => !!s[2]);

  return (
    <LightboxProvider photos={project.photos}>
      {/* CABEÇALHO */}
      <Reveal as="section" className="section-container flex flex-col gap-6 pt-24 pb-16">
        <div data-reveal className="flex flex-wrap items-center gap-3 text-xs font-semibold tracking-label text-fog uppercase">
          <span>{project.category.name}</span>
          {project.year && (
            <>
              <span aria-hidden>•</span>
              <span>{project.year}</span>
            </>
          )}
          {project.location && (
            <>
              <span aria-hidden>•</span>
              <span>{project.location}</span>
            </>
          )}
        </div>
        <h1 data-reveal className="text-[clamp(48px,8vw,128px)] leading-[0.92] font-extrabold tracking-[-0.02em] uppercase">
          <span className="text-chrome">{project.title}</span>
        </h1>
        {project.summary && (
          <p data-reveal className="max-w-[720px] text-[22px] leading-8 font-medium text-mist">
            {project.summary}
          </p>
        )}
      </Reveal>

      {/* CAPA */}
      <section aria-label="Foto de capa" className="mx-auto max-w-[1440px] px-4 sm:px-6">
        {cover ? (
          <OpenPhotoButton index={coverIndex} label="Ampliar foto de capa" className="overflow-hidden rounded-sm">
            <Image
              src={cover.url}
              alt={cover.caption ?? project.title}
              width={cover.width || 2400}
              height={cover.height || 1200}
              priority
              sizes="100vw"
              className="aspect-[16/8] w-full object-cover transition-opacity hover:opacity-90"
            />
          </OpenPhotoButton>
        ) : (
          <PhotoPlaceholder label="Foto de capa — 16:8" className="aspect-[16/8] rounded-sm" />
        )}
      </section>

      {/* FICHA + DESCRIÇÃO */}
      {(facts.length > 0 || project.intro || story.length > 0) && (
        <Reveal as="section" className="section-container flex flex-wrap gap-16 py-24">
          {facts.length > 0 && (
            <aside aria-label="Ficha do projeto" className="min-w-0 flex-[1_1_280px]">
              <dl className="flex flex-col border-t border-line">
                {facts.map(([label, value]) => (
                  <div data-reveal key={label} className="flex flex-col gap-1.5 border-b border-line py-4.5">
                    <dt className="label-caps">{label}</dt>
                    <dd className="font-semibold">{value}</dd>
                  </div>
                ))}
              </dl>
            </aside>
          )}
          <article className="flex min-w-0 flex-[999_1_560px] flex-col gap-12">
            {project.intro && (
              <div className="flex flex-col gap-4">
                <h2 data-reveal className="label-caps">
                  O projeto
                </h2>
                <p data-reveal className="text-[clamp(20px,2vw,26px)] leading-[1.45] font-medium">
                  {project.intro}
                </p>
              </div>
            )}
            {story.length > 0 && (
              <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-10">
                {story.map(([n, title, text]) => (
                  <div data-reveal key={n} className="flex flex-col gap-3 border-t border-line-strong pt-5">
                    <span className="text-[13px] font-bold tracking-[0.04em]">{n}</span>
                    <h3 className="text-[22px] leading-7 font-bold uppercase">{title}</h3>
                    <p className="leading-[26px] text-fog">{text}</p>
                  </div>
                ))}
              </div>
            )}
          </article>
        </Reveal>
      )}

      {/* GALERIA */}
      {project.photos.length > 0 && (
        <Reveal as="section" aria-label="Galeria do projeto" className="section-container flex flex-col gap-8 pb-24">
          <div className="flex items-baseline justify-between gap-4 border-b border-line pb-4">
            <h2 className="label-caps">Galeria</h2>
            <span className="label-caps">{project.photos.length} {project.photos.length === 1 ? 'foto' : 'fotos'} • clique para ampliar</span>
          </div>
          <div className="grid grid-cols-12 gap-6">
            {project.photos.map((photo, i) => {
              const l = LAYOUT[i % LAYOUT.length]!;
              return (
                <figure data-reveal key={photo.id} className={cn('col-span-12 m-0 flex flex-col gap-2.5', l.span)}>
                  <OpenPhotoButton index={i} label={`Ampliar foto ${i + 1}`} className="overflow-hidden rounded-sm bg-ink-3">
                    <Image
                      src={photo.url}
                      alt={photo.caption ?? `${project.title} — foto ${i + 1}`}
                      width={photo.width || 1600}
                      height={photo.height || 1200}
                      sizes="(min-width: 768px) 60vw, 100vw"
                      className={cn('w-full object-cover transition-transform duration-500 hover:scale-[1.02]', l.ratio)}
                    />
                  </OpenPhotoButton>
                  {photo.caption && <figcaption className="text-[13px] leading-[18px] text-fog">{photo.caption}</figcaption>}
                </figure>
              );
            })}
          </div>
        </Reveal>
      )}

      {/* DEPOIMENTO */}
      {project.testimonial && (
        <section className="bg-silver text-coal">
          <Reveal as="figure" className="mx-auto flex max-w-[1040px] flex-col gap-8 px-4 py-28 sm:px-12">
            <span data-reveal className="text-xs font-semibold tracking-label text-graphite uppercase">
              O que o cliente disse
            </span>
            <blockquote data-reveal className="font-display text-[clamp(30px,4vw,52px)] leading-[1.1] font-medium uppercase">
              “{project.testimonial.quote}”
            </blockquote>
            <figcaption data-reveal className="flex flex-wrap items-center gap-3 text-sm font-bold tracking-[0.04em] uppercase">
              {project.testimonial.clientName}
              {project.testimonial.jobLabel && <span className="font-medium text-graphite normal-case">{project.testimonial.jobLabel}</span>}
            </figcaption>
          </Reveal>
        </section>
      )}

      {/* CTA + PRÓXIMO */}
      <Reveal as="section" className="section-container flex flex-wrap items-center justify-between gap-8 border-b border-line pt-28 pb-16">
        <div data-reveal className="flex flex-col gap-2">
          <span className="text-[40px] leading-[1.05] font-extrabold">QUER UM TRABALHO ASSIM?</span>
          <span className="font-script text-[40px] text-mist">vamos conversar</span>
        </div>
        <Link
          data-reveal
          href="/#contato"
          className="inline-flex min-h-13 items-center rounded-sm bg-chalk px-7 text-sm font-bold tracking-[0.08em] text-ink uppercase hover:bg-mist"
        >
          Solicitar orçamento
        </Link>
      </Reveal>
      {next && (
        <Link href={`/portfolio/${next.slug}`} className="group block">
          <div className="section-container flex flex-wrap items-center justify-between gap-6 pt-16 pb-24">
            <div className="flex flex-col gap-3">
              <span className="label-caps">Próximo projeto</span>
              <span className="text-[clamp(36px,6vw,88px)] leading-none font-extrabold uppercase transition-[letter-spacing] duration-300 group-hover:tracking-[0.01em]">
                {next.title}
              </span>
            </div>
            <span
              aria-hidden
              className="flex size-22 items-center justify-center rounded-full border border-line-strong transition-colors group-hover:bg-chalk group-hover:text-ink"
            >
              <ArrowRight className="size-8" strokeWidth={1.5} />
            </span>
          </div>
        </Link>
      )}
    </LightboxProvider>
  );
}
