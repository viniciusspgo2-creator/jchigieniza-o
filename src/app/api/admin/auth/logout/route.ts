import { ok, handleError } from '@/lib/api';
import { destroySession } from '@/lib/auth';
import { audit } from '@/lib/audit';
import { getSessionUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/** POST /api/admin/auth/logout */
export async function POST() {
  try {
    const user = await getSessionUser();
    if (user) {
      await audit({ user, action: 'LOGOUT', entity: 'User', entityId: user.id });
    }
    await destroySession();
    return ok({ loggedOut: true });
  } catch (e) {
    return handleError(e);
  }
}
