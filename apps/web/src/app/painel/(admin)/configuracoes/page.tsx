import type { Metadata } from 'next';
import { Suspense } from 'react';
import { PageSkeleton } from '@/components/admin/admin-ui';
import { SettingsEditor } from '@/components/admin/settings-editor';
import { admin } from '@/lib/api/admin';

export const metadata: Metadata = { title: 'Configurações do site' };

async function Content() {
  return <SettingsEditor initial={await admin.settings()} />;
}

export default function Page() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Content />
    </Suspense>
  );
}
