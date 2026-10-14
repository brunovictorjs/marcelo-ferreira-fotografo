import { cacheLife } from 'next/cache';
import Image from 'next/image';
import { DEFAULT_IMAGES } from '@/lib/config';

export async function SiteFooter({ tagline }: { tagline: string }) {
  'use cache';
  cacheLife('days');
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-line">
      <div className="section-container flex flex-wrap items-center justify-between gap-6 py-12">
        <Image src={DEFAULT_IMAGES.logo} alt="Marcelo Ferreira Fotografia" width={119} height={72} className="h-[72px] w-auto" />
        <span className="text-xs font-medium tracking-wide-label text-fog">{tagline}</span>
        <div className="flex flex-wrap gap-6 text-[13px] text-fog">
          <span>© {year} Marcelo Ferreira Fotografia</span>
        </div>
      </div>
    </footer>
  );
}
