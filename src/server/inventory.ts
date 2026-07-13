'use server';

import { and, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { inventoryItems, inventoryTransactions, vans } from '@/lib/db/schema';
import { requireBusiness } from '@/lib/auth-server';

export type InventoryItemRow = {
  id: string;
  name: string;
  category: string;
  current_stock: number;
  min_stock: number;
  unit_cost: number;
  unit: string;
  supplier: string | null;
  van_id: string | null;
  van_name: string | null;
  is_active: boolean;
  created_at: string;
};

export async function listInventoryItems(): Promise<InventoryItemRow[]> {
  const { businessId } = await requireBusiness();
  const items = await db
    .select()
    .from(inventoryItems)
    .where(and(eq(inventoryItems.businessId, businessId), eq(inventoryItems.isActive, true)))
    .orderBy(inventoryItems.category, inventoryItems.name);
  const vanRows = await db
    .select()
    .from(vans)
    .where(eq(vans.businessId, businessId));
  const vanMap = new Map(vanRows.map((v) => [v.id, v.name]));
  return items.map((i) => ({
    id: i.id,
    name: i.name,
    category: i.category,
    current_stock: Number(i.currentStock),
    min_stock: Number(i.minStock),
    unit_cost: Number(i.unitCost),
    unit: i.unit,
    supplier: i.supplier,
    van_id: i.vanId,
    van_name: i.vanId ? vanMap.get(i.vanId) ?? null : null,
    is_active: i.isActive,
    created_at: i.createdAt.toISOString(),
  }));
}

export async function listVansSimple() {
  const { businessId } = await requireBusiness();
  const rows = await db
    .select()
    .from(vans)
    .where(and(eq(vans.businessId, businessId), eq(vans.isActive, true)))
    .orderBy(vans.name);
  return rows.map((v) => ({ id: v.id, name: v.name }));
}

export async function createInventoryItem(input: {
  name: string;
  category: string;
  current_stock: number;
  min_stock: number;
  unit_cost: number;
  unit: string;
  supplier?: string | null;
  van_id?: string | null;
}) {
  const { businessId } = await requireBusiness();
  const [row] = await db
    .insert(inventoryItems)
    .values({
      name: input.name,
      category: input.category,
      currentStock: String(input.current_stock),
      minStock: String(input.min_stock),
      unitCost: String(input.unit_cost),
      unit: input.unit,
      supplier: input.supplier ?? null,
      vanId: input.van_id ?? null,
      businessId,
    })
    .returning();
  revalidatePath('/dashboard/inventory');
  return row;
}

export async function updateInventoryItem(id: string, input: {
  name?: string;
  category?: string;
  current_stock?: number;
  min_stock?: number;
  unit_cost?: number;
  unit?: string;
  supplier?: string | null;
  van_id?: string | null;
}) {
  const { businessId } = await requireBusiness();
  await db
    .update(inventoryItems)
    .set({
      name: input.name,
      category: input.category,
      currentStock: input.current_stock !== undefined ? String(input.current_stock) : undefined,
      minStock: input.min_stock !== undefined ? String(input.min_stock) : undefined,
      unitCost: input.unit_cost !== undefined ? String(input.unit_cost) : undefined,
      unit: input.unit,
      supplier: input.supplier,
      vanId: input.van_id,
    })
    .where(and(eq(inventoryItems.id, id), eq(inventoryItems.businessId, businessId)));
  revalidatePath('/dashboard/inventory');
}

export async function deleteInventoryItem(id: string) {
  const { businessId } = await requireBusiness();
  await db
    .update(inventoryItems)
    .set({ isActive: false })
    .where(and(eq(inventoryItems.id, id), eq(inventoryItems.businessId, businessId)));
  revalidatePath('/dashboard/inventory');
}

export async function adjustInventoryStock(itemId: string, type: 'add' | 'use' | 'adjust', quantity: number, notes?: string) {
  const { businessId } = await requireBusiness();
  const [item] = await db
    .select()
    .from(inventoryItems)
    .where(and(eq(inventoryItems.id, itemId), eq(inventoryItems.businessId, businessId)))
    .limit(1);
  if (!item) throw new Error('Item not found');
  const cur = Number(item.currentStock);
  const newStock = type === 'add' ? cur + quantity : type === 'use' ? Math.max(0, cur - quantity) : Math.max(0, quantity);
  await db.insert(inventoryTransactions).values({
    itemId,
    type,
    quantity: String(quantity),
    notes: notes ?? null,
    businessId,
  });
  await db
    .update(inventoryItems)
    .set({ currentStock: String(newStock) })
    .where(and(eq(inventoryItems.id, itemId), eq(inventoryItems.businessId, businessId)));
  revalidatePath('/dashboard/inventory');
  return newStock;
}
