'use server';

import { and, desc, eq, inArray } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { appointments, clients, referrals, referralSettings } from '@/lib/db/schema';
import { requireBusiness } from '@/lib/auth-server';

export async function listLoyaltyClients() {
  const { businessId } = await requireBusiness();
  const cs = await db
    .select()
    .from(clients)
    .where(and(eq(clients.businessId, businessId), eq(clients.isActive, true)))
    .orderBy(desc(clients.loyaltyPoints));
  const appts = await db
    .select()
    .from(appointments)
    .where(
      and(
        eq(appointments.businessId, businessId),
        eq(appointments.status, 'completed'),
      ),
    );

  const byClient = new Map<string, { count: number; spent: number }>();
  for (const a of appts) {
    if (!a.clientId) continue;
    const cur = byClient.get(a.clientId) ?? { count: 0, spent: 0 };
    cur.count += 1;
    cur.spent += Number(a.price ?? 0);
    byClient.set(a.clientId, cur);
  }

  return cs.map((c) => {
    const s = byClient.get(c.id) ?? { count: 0, spent: 0 };
    return {
      id: c.id,
      first_name: c.firstName,
      last_name: c.lastName,
      email: c.email,
      phone: c.phone ?? '',
      loyalty_points: c.loyaltyPoints,
      visit_count: s.count,
      total_spent: s.spent,
    };
  });
}

export async function adjustLoyaltyPoints(clientId: string, type: 'add' | 'deduct', points: number) {
  const { businessId } = await requireBusiness();
  const [c] = await db
    .select()
    .from(clients)
    .where(and(eq(clients.id, clientId), eq(clients.businessId, businessId)))
    .limit(1);
  if (!c) throw new Error('Client not found');
  const newPoints = type === 'add' ? c.loyaltyPoints + points : Math.max(0, c.loyaltyPoints - points);
  await db
    .update(clients)
    .set({ loyaltyPoints: newPoints })
    .where(and(eq(clients.id, clientId), eq(clients.businessId, businessId)));
  revalidatePath('/dashboard/loyalty');
  return newPoints;
}

export async function listReferrals() {
  const { businessId } = await requireBusiness();
  // referrals has no businessId; restrict via referrer client
  const businessClients = await db
    .select({ id: clients.id })
    .from(clients)
    .where(eq(clients.businessId, businessId));
  const clientIds = businessClients.map((c) => c.id);
  if (!clientIds.length) return [];
  const rows = await db
    .select()
    .from(referrals)
    .where(inArray(referrals.referrerId, clientIds))
    .orderBy(desc(referrals.createdAt))
    .limit(100);
  return rows.map((r) => ({
    id: r.id,
    referrer_name: r.referrerName ?? '',
    referred_name: r.referredName ?? '',
    referred_email: r.referredEmail ?? '',
    bonus_points: r.bonusPoints,
    created_at: r.createdAt.toISOString(),
    status: r.status,
  }));
}

export async function getLoyaltySettings() {
  const { businessId } = await requireBusiness();
  const [row] = await db
    .select()
    .from(referralSettings)
    .where(eq(referralSettings.businessId, businessId))
    .limit(1);
  return row
    ? {
        points_per_dollar: row.pointsPerDollar,
        redemption_rate: row.redemptionRate,
        welcome_bonus: row.welcomeBonus,
      }
    : { points_per_dollar: 10, redemption_rate: 100, welcome_bonus: 250 };
}

export async function saveLoyaltySettings(input: { points_per_dollar: number; redemption_rate: number; welcome_bonus: number }) {
  const { businessId } = await requireBusiness();
  const [existing] = await db
    .select()
    .from(referralSettings)
    .where(eq(referralSettings.businessId, businessId))
    .limit(1);
  if (existing) {
    await db
      .update(referralSettings)
      .set({
        pointsPerDollar: input.points_per_dollar,
        redemptionRate: input.redemption_rate,
        welcomeBonus: input.welcome_bonus,
      })
      .where(eq(referralSettings.id, existing.id));
  } else {
    await db.insert(referralSettings).values({
      pointsPerDollar: input.points_per_dollar,
      redemptionRate: input.redemption_rate,
      welcomeBonus: input.welcome_bonus,
      businessId,
    });
  }
  revalidatePath('/dashboard/loyalty');
}
