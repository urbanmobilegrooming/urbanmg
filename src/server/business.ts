'use server';

import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { businesses, profiles, staff } from '@/lib/db/schema';
import { requireSession } from '@/lib/auth-server';

export async function setupBusiness(input: {
  name: string;
  slug?: string;
  phone?: string;
  email?: string;
  city?: string;
  state?: string;
  timezone?: string;
  service_areas?: string[];
  groomer_name?: string;
  groomer_commission?: number;
}) {
  const session = await requireSession();

  // Reject if this user already belongs to a business. setupBusiness is a
  // one-time onboarding action — additional businesses must go through admin.
  const [existingProfile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.userId, session.user.id))
    .limit(1);
  if (existingProfile?.businessId) {
    throw new Error('This account is already linked to a business');
  }

  const [biz] = await db
    .insert(businesses)
    .values({
      name: input.name,
      slug: input.slug ?? null,
      phone: input.phone ?? null,
      email: input.email ?? null,
      city: input.city ?? null,
      state: input.state ?? null,
      timezone: input.timezone ?? 'America/New_York',
      serviceAreas: input.service_areas ?? [],
      subscriptionPlan: 'trial',
      trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    })
    .returning();

  await db
    .update(profiles)
    .set({ businessId: biz.id, role: 'admin', updatedAt: new Date() })
    .where(eq(profiles.userId, session.user.id));

  if (input.groomer_name) {
    await db.insert(staff).values({
      firstName: input.groomer_name,
      lastName: '',
      role: 'groomer',
      commissionRate: String(input.groomer_commission ?? 50),
      businessId: biz.id,
    });
  }
  revalidatePath('/dashboard');
  return biz.id;
}
