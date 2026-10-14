import type { Metadata } from 'next';
import { Suspense } from 'react';
import { AcceptInviteForm } from '@/components/admin/auth-forms';

export const metadata: Metadata = { title: 'Criar senha', robots: { index: false } };

export default function Page() {
  return (
    <Suspense>
      <AcceptInviteForm />
    </Suspense>
  );
}
