import type { Metadata } from 'next';
import { Suspense } from 'react';
import { PageSkeleton } from '@/components/admin/admin-ui';
import { ProjectEditor } from '@/components/admin/project-editor';
import { admin } from '@/lib/api/admin';

export const metadata: Metadata = { title: 'Editar projeto' };

async function Content({ params }: Pick<PageProps<'/painel/portfolio/[id]'>, 'params'>) {
  const { id } = await params;
  const [project, categories, services, testimonials] = await Promise.all([
    admin.project(id),
    admin.categories(),
    admin.services(),
    admin.testimonials(),
  ]);
  return <ProjectEditor key={project.id} project={project} categories={categories} services={services} testimonials={testimonials} />;
}

export default function Page({ params }: PageProps<'/painel/portfolio/[id]'>) {
  return (
    <Suspense fallback={<div className="p-10"><PageSkeleton /></div>}>
      <Content params={params} />
    </Suspense>
  );
}
