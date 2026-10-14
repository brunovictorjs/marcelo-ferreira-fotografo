import Image from 'next/image';
import Link from 'next/link';
import { DEFAULT_IMAGES } from '@/lib/config';

export default function AuthLayout({ children }: LayoutProps<'/painel'>) {
  return (
    <main className="flex min-h-dvh items-center justify-center px-6 py-12">
      <div className="flex w-full max-w-[440px] flex-col items-center gap-8">
        <Image src={DEFAULT_IMAGES.logo} alt="Marcelo Ferreira Fotografia" width={220} height={133} priority className="h-auto w-[220px]" />
        {children}
        <Link href="/" className="text-xs font-semibold tracking-label text-mist uppercase hover:text-white">
          Voltar ao site
        </Link>
      </div>
    </main>
  );
}
