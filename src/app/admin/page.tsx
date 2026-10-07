import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/** /admin → redireciona conforme a sessão. */
export default async function AdminIndex() {
  const user = await getSessionUser();
  if (user) redirect('/admin/painel');
  redirect('/admin/login');
}
