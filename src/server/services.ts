'use server';

import { and, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import {
  serviceAddons,
  serviceCategories,
  servicePricing,
  services,
} from '@/lib/db/schema';
import { requireBusiness } from '@/lib/auth-server';

type SvcRow = typeof services.$inferSelect;
type CatRow = typeof serviceCategories.$inferSelect;
type PriceRow = typeof servicePricing.$inferSelect;

const catToApi = (c: CatRow) => ({
  id: c.id,
  name: c.name,
  description: c.description,
  color: c.color,
  sort_order: c.sortOrder,
});

const priceToApi = (p: PriceRow) => ({
  id: p.id,
  service_id: p.serviceId,
  size_category: p.sizeCategory,
  price: Number(p.price),
});

const svcToApi = (
  s: SvcRow,
  cat: CatRow | null,
  pricing: PriceRow[]
) => ({
  id: s.id,
  name: s.name,
  description: s.description,
  duration_minutes: s.durationMinutes,
  base_price: s.basePrice != null ? Number(s.basePrice) : null,
  is_active: s.isActive,
  category_id: s.categoryId,
  service_categories: cat
    ? { id: cat.id, name: cat.name, color: cat.color }
    : null,
  service_pricing: pricing.map(priceToApi),
});

export async function listCategories() {
  const { businessId } = await requireBusiness();
  const rows = await db
    .select()
    .from(serviceCategories)
    .where(eq(serviceCategories.businessId, businessId))
    .orderBy(serviceCategories.sortOrder);
  return rows.map(catToApi);
}

export async function listServices() {
  const { businessId } = await requireBusiness();
  const rows = await db
    .select()
    .from(services)
    .leftJoin(serviceCategories, eq(services.categoryId, serviceCategories.id))
    .where(eq(services.businessId, businessId))
    .orderBy(services.name);
  const priceRows = await db
    .select()
    .from(servicePricing)
    .where(eq(servicePricing.businessId, businessId));
  const byService = new Map<string, PriceRow[]>();
  for (const p of priceRows) {
    const arr = byService.get(p.serviceId) ?? [];
    arr.push(p);
    byService.set(p.serviceId, arr);
  }
  return rows.map((r) =>
    svcToApi(r.services, r.service_categories, byService.get(r.services.id) ?? [])
  );
}

export async function listActiveServices() {
  const { businessId } = await requireBusiness();
  const rows = await db
    .select()
    .from(services)
    .where(and(eq(services.businessId, businessId), eq(services.isActive, true)))
    .orderBy(services.name);
  const priceRows = await db
    .select()
    .from(servicePricing)
    .where(eq(servicePricing.businessId, businessId));
  const byService = new Map<string, PriceRow[]>();
  for (const p of priceRows) {
    const arr = byService.get(p.serviceId) ?? [];
    arr.push(p);
    byService.set(p.serviceId, arr);
  }
  return rows.map((s) => svcToApi(s, null, byService.get(s.id) ?? []));
}

export async function createCategory(input: { name: string; color?: string }) {
  const { businessId } = await requireBusiness();
  const [row] = await db
    .insert(serviceCategories)
    .values({ name: input.name, color: input.color ?? '#f2c037', businessId })
    .returning();
  revalidatePath('/dashboard/services');
  return catToApi(row);
}

export async function createService(input: {
  name: string;
  description?: string | null;
  duration_minutes?: number;
  category_id?: string | null;
  base_price?: number | null;
  pricing?: { size_category: string; price: number }[];
}) {
  const { businessId } = await requireBusiness();
  const [svc] = await db
    .insert(services)
    .values({
      name: input.name,
      description: input.description ?? null,
      durationMinutes: input.duration_minutes ?? 60,
      categoryId: input.category_id ?? null,
      basePrice: input.base_price != null ? String(input.base_price) : null,
      businessId,
    })
    .returning();

  let pricing: PriceRow[] = [];
  if (input.pricing && input.pricing.length > 0) {
    pricing = await db
      .insert(servicePricing)
      .values(
        input.pricing.map((p) => ({
          serviceId: svc.id,
          sizeCategory: p.size_category,
          price: String(p.price),
          businessId,
        }))
      )
      .returning();
  }
  revalidatePath('/dashboard/services');
  return svcToApi(svc, null, pricing);
}

export async function updateService(id: string, input: {
  name?: string;
  duration_minutes?: number;
  base_price?: number | null;
  is_active?: boolean;
}) {
  const { businessId } = await requireBusiness();
  await db
    .update(services)
    .set({
      name: input.name,
      durationMinutes: input.duration_minutes,
      basePrice: input.base_price != null ? String(input.base_price) : null,
      isActive: input.is_active,
      updatedAt: new Date(),
    })
    .where(and(eq(services.id, id), eq(services.businessId, businessId)));
  revalidatePath('/dashboard/services');
}

// ----- service_addons -----

export async function listAddons() {
  const { businessId } = await requireBusiness();
  const rows = await db
    .select()
    .from(serviceAddons)
    .where(eq(serviceAddons.businessId, businessId))
    .orderBy(serviceAddons.name);
  return rows.map((a) => ({
    id: a.id,
    name: a.name,
    price: Number(a.price),
    duration_minutes: a.durationMinutes,
    service_id: a.serviceId,
    is_active: a.isActive,
  }));
}

export async function createAddon(input: {
  name: string;
  price: number;
  duration_minutes?: number | null;
}) {
  const { businessId } = await requireBusiness();
  await db.insert(serviceAddons).values({
    name: input.name,
    price: String(input.price),
    durationMinutes: input.duration_minutes ?? null,
    businessId,
  });
  revalidatePath('/dashboard/products');
}

export async function deleteAddon(id: string) {
  const { businessId } = await requireBusiness();
  await db
    .delete(serviceAddons)
    .where(and(eq(serviceAddons.id, id), eq(serviceAddons.businessId, businessId)));
  revalidatePath('/dashboard/products');
}
