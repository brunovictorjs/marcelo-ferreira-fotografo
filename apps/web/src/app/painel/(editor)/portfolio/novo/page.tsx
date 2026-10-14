import type { Metadata } from 'next';
import { Suspense } from 'react';
import { PageSkeleton } from '@/components/admin/admin-ui';
import { ProjectEditor } from '@/components/admin/project-editor';
import { admin } from '@/lib/api/admin';

export const metadata: Metadata = { title: 'Novo projeto' };

async function Content() {
  const [categories, services, testimonials] = await Promise.all([admin.categories(), admin.services(), admin.testimonials()]);
  return <ProjectEditor project={null} categories={categories} services={services} testimonials={testimonials} />;
}

export default function Page() {
  return (
    <Suspense fallback={<div className="p-10"><PageSkeleton /></div>}>
      <Content />
    </Suspense>
  );
}
