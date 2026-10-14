import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { ProjectView } from '@/components/site/project-view';
import { SiteFooter } from '@/components/site/site-footer';
import { SiteHeader } from '@/components/site/site-header';
import { getHomePage, getProjectPage } from '@/lib/api/public';

/** Pré-renderiza os projetos publicados; novos entram sob demanda (ISR). */
export async function generateStaticParams() {
  const { projects } = await getHomePage();
  // Cache Components exige ao menos um parâmetro.
  return projects.length ? projects.map((p) => ({ slug: p.slug })) : [{ slug: 'sem-projetos' }];
}

export async function generateMetadata({ params }: PageProps<'/portfolio/[slug]'>): Promise<Metadata> {
  const page = await getProjectPage((await params).slug);
  if (!page) return { title: 'Projeto não encontrado' };
  const { project } = page;
  return {
    title: project.title,
    description: project.summary ?? undefined,
    openGraph: {
      title: project.title,
      description: project.summary ?? undefined,
      images: project.coverUrl ? [{ url: project.coverUrl }] : undefined,
    },
  };
}

async function ProjectContent({ params }: Pick<PageProps<'/portfolio/[slug]'>, 'params'>) {
  const page = await getProjectPage((await params).slug);
  if (!page) notFound();
  return <ProjectView project={page.project} next={page.next} />;
}

function ProjectSkeleton() {
  return (
    <div className="section-container flex animate-pulse flex-col gap-6 pt-24 pb-16" aria-busy="true">
      <div className="h-3 w-48 rounded-sm bg-ink-3" />
      <div className="h-24 w-3/4 rounded-sm bg-ink-3" />
      <div className="aspect-[16/8] w-full rounded-sm bg-ink-3" />
    </div>
  );
}

export default function ProjectPage({ params }: PageProps<'/portfolio/[slug]'>) {
  return (
    <>
      <SiteHeader variant="project" />
      <main>
        <Suspense fallback={<ProjectSkeleton />}>
          <ProjectContent params={params} />
        </Suspense>
      </main>
      <SiteFooter tagline="LUZ • OLHAR • HISTÓRIA" />
    </>
  );
}
