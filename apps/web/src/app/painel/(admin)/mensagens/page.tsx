import type { Metadata } from 'next';
import { Suspense } from 'react';
import { PageSkeleton } from '@/components/admin/admin-ui';
import { MessagesInbox } from '@/components/admin/messages-inbox';
import { admin } from '@/lib/api/admin';

export const metadata: Metadata = { title: 'Mensagens' };

async function Content() {
  return <MessagesInbox initial={await admin.messages('all')} />;
}

export default function Page() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Content />
    </Suspense>
  );
}
