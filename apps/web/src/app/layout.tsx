import type { Metadata } from 'next';
import { Montserrat, Mr_Dafoe, Oswald } from 'next/font/google';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { SITE_URL } from '@/lib/config';
import './globals.css';

const montserrat = Montserrat({
  variable: '--font-montserrat',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
});

const oswald = Oswald({
  variable: '--font-oswald',
  subsets: ['latin'],
  weight: ['500', '700'],
});

const mrDafoe = Mr_Dafoe({
  variable: '--font-mr-dafoe',
  subsets: ['latin'],
  weight: '400',
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: 'Marcelo Ferreira Fotografia', template: '%s — Marcelo Ferreira Fotografia' },
  description: 'Retratos, casamentos, eventos e fotografia para marcas.',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="pt-BR" className={`${montserrat.variable} ${oswald.variable} ${mrDafoe.variable} dark`}>
      <body className="min-h-dvh">
        <TooltipProvider>{children}</TooltipProvider>
        <Toaster position="top-center" theme="dark" />
      </body>
    </html>
  );
}
