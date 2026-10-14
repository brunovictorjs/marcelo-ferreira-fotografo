import type { Metadata } from 'next';
import { Suspense } from 'react';
import { PageSkeleton } from '@/components/admin/admin-ui';
import { ServicesManager } from '@/components/admin/services-manager';
import { admin } from '@/lib/api/admin';

export const metadata: Metadata = { title: 'Serviços' };

async function Content() {
  return <ServicesManager services={await admin.services()} />;
}

export default function Page() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Content />
    </Suspense>
  );
}
