import type { Metadata } from 'next';
import { Suspense } from 'react';
import { PageSkeleton } from '@/components/admin/admin-ui';
import { TestimonialsManager } from '@/components/admin/testimonials-manager';
import { admin } from '@/lib/api/admin';

export const metadata: Metadata = { title: 'Depoimentos' };

async function Content() {
  const [testimonials, projects] = await Promise.all([admin.testimonials(), admin.projects()]);
  return <TestimonialsManager testimonials={testimonials} projects={projects} />;
}

export default function Page() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Content />
    </Suspense>
  );
}
