'use server';

import { and, desc, eq, isNotNull } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import {
  appointments,
  clients,
  marketingCampaigns,
  pets,
  reminderSettings,
} from '@/lib/db/schema';
import { requireBusiness } from '@/lib/auth-server';

export async function listBirthdayPets() {
  const { businessId } = await requireBusiness();
  const rows = await db
    .select()
    .from(pets)
    .leftJoin(clients, eq(pets.clientId, clients.id))
    .where(and(eq(pets.businessId, businessId), isNotNull(pets.dateOfBirth)));

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return rows.map((r) => {
    const p = r.pets;
    const c = r.clients;
    const bd = p.dateOfBirth ? new Date(p.dateOfBirth + 'T00:00:00') : null;
    let daysUntil = 9999;
    if (bd) {
      const thisYear = new Date(today.getFullYear(), bd.getMonth(), bd.getDate());
      daysUntil = Math.round((thisYear.getTime() - today.getTime()) / 86400000);
      if (daysUntil < -1) {
        const nextYear = new Date(today.getFullYear() + 1, bd.getMonth(), bd.getDate());
        daysUntil = Math.round((nextYear.getTime() - today.getTime()) / 86400000);
      }
    }
    return {
      id: p.id,
      name: p.name,
      breed: p.breed,
      birth_date: p.dateOfBirth,
      owner_name: c ? `${c.firstName} ${c.lastName}` : 'Unknown',
      owner_phone: c?.phone ?? null,
      owner_email: c?.email ?? null,
      daysUntil,
    };
  });
}

export async function listRebookClients() {
  const { businessId } = await requireBusiness();
  const allClients = await db
    .select()
    .from(clients)
    .where(and(eq(clients.businessId, businessId), eq(clients.isActive, true)));
  const allAppts = await db
    .select()
    .from(appointments)
    .where(
      and(
        eq(appointments.businessId, businessId),
        eq(appointments.status, 'completed'),
      ),
    )
    .orderBy(desc(appointments.date));

  const lastApptByClient = new Map<string, string>();
  for (const a of allAppts) {
    if (!a.clientId) continue;
    if (!lastApptByClient.has(a.clientId)) lastApptByClient.set(a.clientId, a.date);
  }

  const today = new Date();
  return allClients.map((c) => {
    const lastVisit = lastApptByClient.get(c.id) ?? null;
    const daysSince = lastVisit
      ? Math.floor((today.getTime() - new Date(lastVisit).getTime()) / 86400000)
      : 9999;
    return {
      id: c.id,
      first_name: c.firstName,
      last_name: c.lastName,
      email: c.email,
      phone: c.phone,
      last_visit: lastVisit,
      daysSince,
    };
  });
}

export async function listCampaigns() {
  const { businessId } = await requireBusiness();
  const rows = await db
    .select()
    .from(marketingCampaigns)
    .where(eq(marketingCampaigns.businessId, businessId))
    .orderBy(desc(marketingCampaigns.createdAt));
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    description: r.description,
    discount: r.discount,
    audience: r.audience,
    start_date: r.startDate,
    end_date: r.endDate,
    color: r.color,
    icon: r.icon,
  }));
}

export async function createCampaign(input: {
  name: string;
  description?: string;
  discount?: string;
  audience: string;
  start_date?: string;
  end_date?: string;
  color?: string;
  icon?: string;
}) {
  const { businessId } = await requireBusiness();
  await db.insert(marketingCampaigns).values({
    name: input.name,
    description: input.description ?? null,
    discount: input.discount ?? null,
    audience: input.audience,
    startDate: input.start_date ?? null,
    endDate: input.end_date ?? null,
    color: input.color ?? null,
    icon: input.icon ?? 'megaphone',
    businessId,
  });
  revalidatePath('/dashboard/marketing');
}

// reminder settings (used by automations page)
export async function listReminderSettings() {
  const { businessId } = await requireBusiness();
  const rows = await db
    .select()
    .from(reminderSettings)
    .where(eq(reminderSettings.businessId, businessId));
  return rows.map((r) => ({
    id: r.id,
    type: r.type,
    enabled: r.enabled,
    hours_offset: r.hoursOffset,
    template_id: r.templateId,
  }));
}

export async function upsertReminderSetting(input: {
  id?: string;
  type: string;
  enabled: boolean;
  hours_offset: number;
  template_id?: string | null;
}) {
  const { businessId } = await requireBusiness();
  if (input.id) {
    await db
      .update(reminderSettings)
      .set({
        enabled: input.enabled,
        hoursOffset: input.hours_offset,
        templateId: input.template_id ?? null,
      })
      .where(
        and(
          eq(reminderSettings.id, input.id),
          eq(reminderSettings.businessId, businessId),
        ),
      );
  } else {
    await db.insert(reminderSettings).values({
      type: input.type,
      enabled: input.enabled,
      hoursOffset: input.hours_offset,
      templateId: input.template_id ?? null,
      businessId,
    });
  }
  revalidatePath('/dashboard/automations');
}
