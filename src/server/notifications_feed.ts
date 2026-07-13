'use server';

import { and, desc, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { notifications } from '@/lib/db/schema';
import { requireBusiness } from '@/lib/auth-server';

export type NotificationRow = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  href: string | null;
  is_read: boolean;
  created_at: string;
};

export async function getNotificationsFeed(): Promise<{ items: NotificationRow[]; unread: number }> {
  const { businessId } = await requireBusiness();
  const rows = await db
    .select()
    .from(notifications)
    .where(eq(notifications.businessId, businessId))
    .orderBy(desc(notifications.createdAt))
    .limit(30);
  return {
    items: rows.map((r) => ({
      id: r.id,
      type: r.type,
      title: r.title,
      body: r.body,
      href: r.href,
      is_read: r.isRead,
      created_at: r.createdAt.toISOString(),
    })),
    unread: rows.filter((r) => !r.isRead).length,
  };
}

export async function markNotificationRead(id: string) {
  const { businessId } = await requireBusiness();
  await db
    .update(notifications)
    .set({ isRead: true })
    .where(and(eq(notifications.id, id), eq(notifications.businessId, businessId)));
}

export async function markAllNotificationsRead() {
  const { businessId } = await requireBusiness();
  await db
    .update(notifications)
    .set({ isRead: true })
    .where(and(eq(notifications.businessId, businessId), eq(notifications.isRead, false)));
}
