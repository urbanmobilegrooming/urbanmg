import { headers } from 'next/headers';
import { eq } from 'drizzle-orm';
import { auth } from './auth';
import { db } from './db';
import { profiles } from './db/schema/auth';

export async function getSession() {
  return auth.api.getSession({ headers: await headers() });
}

export async function requireSession() {
  const session = await getSession();
  if (!session) throw new Error('Unauthorized');
  return session;
}

/**
 * Returns { session, profile, businessId, role }. Throws if no session
 * or if the user has no linked profile/business.
 */
export async function requireBusiness() {
  const session = await requireSession();
  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.userId, session.user.id))
    .limit(1);
  if (!profile) throw new Error('Profile not found');
  if (!profile.businessId) throw new Error('No business linked to this account');
  if (profile.isActive === false) throw new Error('Account deactivated');
  return {
    session,
    profile,
    businessId: profile.businessId,
    role: profile.role ?? 'staff',
  };
}

/**
 * Same as requireBusiness() but also enforces role membership.
 */
export async function requireRole(allowed: string[]) {
  const ctx = await requireBusiness();
  if (!allowed.includes(ctx.role)) throw new Error('Forbidden');
  return ctx;
}
