'use server';

import { and, desc, eq, gte, ilike, inArray, lte, type SQL } from 'drizzle-orm';
import { db } from '@/lib/db';
import { activityLog } from '@/lib/db/schema';
import { profiles } from '@/lib/db/schema/auth';
import { requireBusiness } from '@/lib/auth-server';

export type ActivityEntry = {
  id: string;
  type: string;
  description: string;
  user_name: string | null;
  client_name: string | null;
  created_at: string;
  metadata: Record<string, unknown> | null;
};

export async function listActivity(input: {
  search?: string;
  type?: string;
  date_from?: string;
  date_to?: string;
  offset?: number;
  limit?: number;
}): Promise<ActivityEntry[]> {
  const { businessId } = await requireBusiness();

  // Only show activity from users in our business.
  const businessUsers = await db
    .select({ userId: profiles.userId })
    .from(profiles)
    .where(eq(profiles.businessId, businessId));
  const businessUserIds = businessUsers
    .map((u) => u.userId)
    .filter((u): u is string => !!u);
  if (businessUserIds.length === 0) return [];

  const conds: SQL[] = [inArray(activityLog.userId, businessUserIds)];
  if (input.type) conds.push(ilike(activityLog.type, `${input.type}%`));
  if (input.search) conds.push(ilike(activityLog.description, `%${input.search}%`));
  if (input.date_from) conds.push(gte(activityLog.createdAt, new Date(input.date_from + 'T00:00:00')));
  if (input.date_to) conds.push(lte(activityLog.createdAt, new Date(input.date_to + 'T23:59:59')));

  const limit = input.limit ?? 40;
  const offset = input.offset ?? 0;
  const rows = await db
    .select()
    .from(activityLog)
    .where(and(...conds))
    .orderBy(desc(activityLog.createdAt))
    .limit(limit)
    .offset(offset);

  return rows.map((r) => ({
    id: r.id,
    type: r.type,
    description: r.description ?? r.action ?? '',
    user_name: r.userName,
    client_name: r.clientName,
    created_at: r.createdAt.toISOString(),
    metadata: (r.metadata as Record<string, unknown>) ?? null,
  }));
}
