import type { Metadata } from 'next';
import { Suspense } from 'react';
import { PageSkeleton } from '@/components/admin/admin-ui';
import { UsersManager } from '@/components/admin/users-manager';
import { admin, getSessionUser } from '@/lib/api/admin';

export const metadata: Metadata = { title: 'Usuários' };

async function Content() {
  const [users, activity, me] = await Promise.all([admin.users(), admin.activity(), getSessionUser()]);
  return <UsersManager users={users} activity={activity} meId={me.id} />;
}

export default function Page() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Content />
    </Suspense>
  );
}
