import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { ProjectView } from '@/components/site/project-view';
import { SiteHeader } from '@/components/site/site-header';
import { admin } from '@/lib/api/admin';

export const metadata: Metadata = { title: 'Pré-visualização', robots: { index: false } };

/** Mostra o projeto exatamente como ficará no site — inclusive rascunhos. */
async function Preview({ params }: Pick<PageProps<'/painel/portfolio/[id]/previa'>, 'params'>) {
  const project = await admin.project((await params).id);
  return (
    <>
      <div role="status" className="sticky top-0 z-50 flex flex-wrap items-center justify-center gap-4 bg-chalk px-4 py-2.5 text-xs font-bold tracking-[0.08em] text-ink uppercase">
        Pré-visualização • {project.status === 'PUBLISHED' ? 'publicado' : 'rascunho — não aparece no site'}
        <Link href={`/painel/portfolio/${project.id}`} className="underline underline-offset-2">Voltar ao editor</Link>
      </div>
      <SiteHeader variant="project" />
      <ProjectView project={project} next={null} />
    </>
  );
}

export default function Page({ params }: PageProps<'/painel/portfolio/[id]/previa'>) {
  return (
    <Suspense>
      <Preview params={params} />
    </Suspense>
  );
}
