import type { Metadata } from 'next';
import { Suspense } from 'react';
import { PageSkeleton } from '@/components/admin/admin-ui';
import { CategoriesManager } from '@/components/admin/categories-manager';
import { admin } from '@/lib/api/admin';

export const metadata: Metadata = { title: 'Categorias' };

async function Content() {
  return <CategoriesManager categories={await admin.categories()} />;
}

export default function Page() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Content />
    </Suspense>
  );
}
