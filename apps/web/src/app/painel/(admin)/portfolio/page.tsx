import type { Metadata } from 'next';
import { Suspense } from 'react';
import { PageSkeleton } from '@/components/admin/admin-ui';
import { ProjectsTable } from '@/components/admin/projects-table';
import { admin } from '@/lib/api/admin';

export const metadata: Metadata = { title: 'Portfólio' };

async function Content() {
  const [projects, categories] = await Promise.all([admin.projects(), admin.categories()]);
  return <ProjectsTable projects={projects} categories={categories} />;
}

export default function Page() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Content />
    </Suspense>
  );
}
