import { ArrowLeft } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { DEFAULT_IMAGES } from '@/lib/config';

const NAV = [
  { href: '/#portfolio', label: 'Portfólio' },
  { href: '/#servicos', label: 'Serviços' },
  { href: '/#sobre', label: 'Sobre' },
  { href: '/#depoimentos', label: 'Depoimentos' },
  { href: '/#contato', label: 'Contato' },
];

/** Cabeçalho fixo. Na página de projeto mostra "Voltar ao portfólio". */
export function SiteHeader({ variant = 'home', ctaLabel = 'Agendar ensaio' }: { variant?: 'home' | 'project'; ctaLabel?: string }) {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-ink/90 backdrop-blur-sm">
      <nav
        aria-label="Principal"
        className="section-container flex flex-wrap items-center justify-between gap-x-8 gap-y-4 py-3.5"
      >
        <Link href="/#inicio" aria-label="Marcelo Ferreira Fotografia — início" className="flex">
          <Image src={DEFAULT_IMAGES.logo} alt="Marcelo Ferreira Fotografia" width={86} height={52} priority className="h-[52px] w-auto" />
        </Link>

        {variant === 'home' ? (
          <div className="order-3 -mx-4 flex w-[calc(100%+2rem)] items-center gap-x-7 overflow-x-auto px-4 text-xs font-semibold tracking-label whitespace-nowrap uppercase [scrollbar-width:none] sm:-mx-8 sm:w-[calc(100%+4rem)] sm:px-8 md:order-none md:mx-0 md:w-auto md:gap-x-8 md:px-0 [&::-webkit-scrollbar]:hidden">
            {NAV.map((item) => (
              <Link key={item.href} href={item.href} className="text-fog transition-colors hover:text-chalk">
                {item.label}
              </Link>
            ))}
          </div>
        ) : (
          <Link
            href="/#portfolio"
            className="inline-flex min-h-11 items-center gap-2.5 text-xs font-semibold tracking-label text-fog uppercase hover:text-chalk"
          >
            <ArrowLeft className="size-[18px]" strokeWidth={1.5} aria-hidden />
            Voltar ao portfólio
          </Link>
        )}

        <Link
          href="/#contato"
          className="inline-flex min-h-11 items-center rounded-sm bg-chalk px-5.5 text-[13px] font-bold tracking-[0.08em] text-ink uppercase transition-colors hover:bg-mist"
        >
          {ctaLabel}
        </Link>
      </nav>
    </header>
  );
}
