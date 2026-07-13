'use server';

import { and, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { products } from '@/lib/db/schema';
import { requireBusiness } from '@/lib/auth-server';

export async function listProducts() {
  const { businessId } = await requireBusiness();
  const rows = await db
    .select()
    .from(products)
    .where(eq(products.businessId, businessId))
    .orderBy(products.name);
  return rows.map((p) => ({
    id: p.id,
    name: p.name,
    sku: p.sku,
    price: Number(p.price),
    cost: p.cost != null ? Number(p.cost) : null,
    stock: p.stock,
    category: p.category,
    description: p.description,
    is_active: p.isActive,
  }));
}

export async function createProduct(input: {
  name: string;
  description?: string | null;
  sku?: string | null;
  price: number;
  cost?: number | null;
  stock?: number;
  category?: string | null;
}) {
  const { businessId } = await requireBusiness();
  await db.insert(products).values({
    name: input.name,
    description: input.description ?? null,
    sku: input.sku ?? null,
    price: String(input.price),
    cost: input.cost != null ? String(input.cost) : null,
    stock: input.stock ?? 0,
    category: input.category ?? null,
    businessId,
  });
  revalidatePath('/dashboard/products');
}

export async function deleteProduct(id: string) {
  const { businessId } = await requireBusiness();
  await db
    .delete(products)
    .where(and(eq(products.id, id), eq(products.businessId, businessId)));
  revalidatePath('/dashboard/products');
}
