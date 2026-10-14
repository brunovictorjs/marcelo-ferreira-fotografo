import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="section-container flex min-h-dvh flex-col items-start justify-center gap-6">
      <span className="label-caps">Erro 404</span>
      <h1 className="text-[clamp(48px,8vw,104px)] leading-[0.95] font-extrabold uppercase">
        Fora de
        <br />
        <span className="text-chrome">foco.</span>
      </h1>
      <p className="max-w-md text-fog">A página que você procurou não existe ou não está mais publicada.</p>
      <Link
        href="/"
        className="inline-flex min-h-13 items-center rounded-sm bg-chalk px-7 text-sm font-bold tracking-[0.08em] text-ink uppercase hover:bg-mist"
      >
        Voltar ao início
      </Link>
    </main>
  );
}
