'use server';

import { and, desc, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { discountCodes } from '@/lib/db/schema';
import { requireBusiness } from '@/lib/auth-server';

export async function listDiscountCodes() {
  const { businessId } = await requireBusiness();
  const rows = await db
    .select()
    .from(discountCodes)
    .where(eq(discountCodes.businessId, businessId))
    .orderBy(desc(discountCodes.createdAt));
  return rows.map((c) => ({
    id: c.id,
    code: c.code,
    type: c.type,
    value: Number(c.value),
    min_order_amount: Number(c.minOrderAmount),
    max_uses: c.maxUses,
    used_count: c.usedCount,
    valid_from: c.validFrom,
    valid_until: c.validUntil,
    is_active: c.isActive,
  }));
}

export async function createDiscountCode(input: {
  code: string;
  type: string;
  value: number;
  min_order_amount?: number;
  max_uses?: number | null;
  valid_from?: string | null;
  valid_until?: string | null;
}) {
  const { businessId } = await requireBusiness();
  await db.insert(discountCodes).values({
    code: input.code,
    type: input.type,
    value: String(input.value),
    minOrderAmount: String(input.min_order_amount ?? 0),
    maxUses: input.max_uses ?? null,
    validFrom: input.valid_from ?? null,
    validUntil: input.valid_until ?? null,
    businessId,
  });
  revalidatePath('/dashboard/discounts');
}

export async function toggleDiscountActive(id: string, current: boolean) {
  const { businessId } = await requireBusiness();
  await db
    .update(discountCodes)
    .set({ isActive: !current })
    .where(and(eq(discountCodes.id, id), eq(discountCodes.businessId, businessId)));
  revalidatePath('/dashboard/discounts');
}

export async function deleteDiscountCode(id: string) {
  const { businessId } = await requireBusiness();
  await db
    .delete(discountCodes)
    .where(and(eq(discountCodes.id, id), eq(discountCodes.businessId, businessId)));
  revalidatePath('/dashboard/discounts');
}
