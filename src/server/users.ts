'use server';

import { and, desc, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { businesses, profiles, pushTokens } from '@/lib/db/schema';
import { getSession, requireBusiness, requireRole, requireSession } from '@/lib/auth-server';

export async function listProfiles() {
  const { businessId } = await requireBusiness();
  const rows = await db
    .select()
    .from(profiles)
    .where(eq(profiles.businessId, businessId))
    .orderBy(desc(profiles.createdAt));
  return rows.map((p) => ({
    id: p.id,
    user_id: p.userId,
    full_name: p.fullName,
    first_name: p.firstName,
    last_name: p.lastName,
    email: p.email,
    phone: p.phone,
    role: p.role,
    avatar_url: p.avatarUrl,
    is_active: p.isActive,
    business_id: p.businessId,
    created_at: p.createdAt,
  }));
}

export async function getCurrentProfile() {
  const session = await getSession();
  if (!session) return null;
  const userId = session.user.id;
  const [row] = await db.select().from(profiles).where(eq(profiles.userId, userId)).limit(1);
  if (!row) return null;
  let business = null;
  if (row.businessId) {
    const [b] = await db.select().from(businesses).where(eq(businesses.id, row.businessId)).limit(1);
    if (b) business = b;
  }
  return {
    profile: {
      id: row.id,
      user_id: row.userId,
      full_name: row.fullName,
      email: row.email,
      phone: row.phone,
      role: row.role,
      avatar_url: row.avatarUrl,
      is_active: row.isActive,
      business_id: row.businessId,
    },
    business: business
      ? {
          id: business.id,
          name: business.name,
          slug: business.slug,
          phone: business.phone,
          email: business.email,
          website: business.website,
          address: business.address,
          city: business.city,
          state: business.state,
          zip: business.zip,
          timezone: business.timezone,
          service_areas: business.serviceAreas,
          subscription_plan: business.subscriptionPlan,
        }
      : null,
  };
}

export async function updateProfileRole(profileId: string, role: string) {
  const { businessId } = await requireRole(['admin', 'owner']);
  await db
    .update(profiles)
    .set({ role, updatedAt: new Date() })
    .where(and(eq(profiles.id, profileId), eq(profiles.businessId, businessId)));
  revalidatePath('/dashboard/users');
}

export async function toggleProfileActive(profileId: string, currentActive: boolean) {
  const { businessId } = await requireRole(['admin', 'owner']);
  await db
    .update(profiles)
    .set({ isActive: !currentActive, updatedAt: new Date() })
    .where(and(eq(profiles.id, profileId), eq(profiles.businessId, businessId)));
  revalidatePath('/dashboard/users');
}

export async function updateMyProfile(input: { full_name?: string; phone?: string }) {
  const session = await requireSession();
  await db
    .update(profiles)
    .set({
      fullName: input.full_name ?? undefined,
      phone: input.phone ?? undefined,
      updatedAt: new Date(),
    })
    .where(eq(profiles.userId, session.user.id));
  revalidatePath('/dashboard/settings');
}

export async function updateBusiness(input: {
  id: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  timezone?: string;
  service_areas?: string[];
}) {
  const { businessId } = await requireRole(['admin', 'owner']);
  // Only allow updating your own business
  if (input.id !== businessId) {
    throw new Error('Forbidden');
  }
  await db
    .update(businesses)
    .set({
      name: input.name,
      phone: input.phone ?? null,
      email: input.email ?? null,
      website: input.website ?? null,
      address: input.address ?? null,
      city: input.city ?? null,
      state: input.state ?? null,
      zip: input.zip ?? null,
      timezone: input.timezone ?? 'America/New_York',
      serviceAreas: input.service_areas ?? [],
      updatedAt: new Date(),
    })
    .where(eq(businesses.id, businessId));
  revalidatePath('/dashboard/settings');
}

export async function registerPushToken(token: string, platform = 'web') {
  const session = await getSession();
  if (!session) return;
  try {
    await db.insert(pushTokens).values({
      userId: session.user.id,
      token,
      platform,
    });
  } catch {
    // ignore duplicate
  }
}
