import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';
import { AdminShell } from '@/components/admin/shell';

export const metadata: Metadata = {
  title: { default: 'Painel', template: '%s | Painel JC' },
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect('/admin/login');

  return <AdminShell user={user}>{children}</AdminShell>;
}
