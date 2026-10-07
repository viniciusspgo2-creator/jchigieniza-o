import { ok, handleError } from '@/lib/api';
import { getSessionUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/** GET /api/admin/auth/me */
export async function GET() {
  try {
    const user = await getSessionUser();
    return ok({ user });
  } catch (e) {
    return handleError(e);
  }
}
