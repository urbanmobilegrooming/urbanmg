'use server';

import { and, asc, eq, inArray } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { staffMessages } from '@/lib/db/schema';
import { profiles } from '@/lib/db/schema/auth';
import { requireBusiness } from '@/lib/auth-server';

export type ChatMessageRow = {
  id: string;
  channel: string;
  sender_id: string | null;
  sender_name: string;
  message: string;
  is_pinned: boolean;
  created_at: string;
};

// staff_messages has no businessId column — scope by sender_id belonging to a
// profile in our business.
async function getBusinessUserIds(businessId: string): Promise<string[]> {
  const rows = await db
    .select({ userId: profiles.userId })
    .from(profiles)
    .where(eq(profiles.businessId, businessId));
  return rows.map((r) => r.userId).filter((u): u is string => !!u);
}

export async function listChatMessages(): Promise<ChatMessageRow[]> {
  const { businessId } = await requireBusiness();
  const userIds = await getBusinessUserIds(businessId);
  if (userIds.length === 0) return [];

  const rows = await db
    .select()
    .from(staffMessages)
    .where(inArray(staffMessages.senderId, userIds))
    .orderBy(asc(staffMessages.createdAt))
    .limit(500);
  return rows.map((m) => ({
    id: m.id,
    channel: m.channel,
    sender_id: m.senderId,
    sender_name: m.senderName,
    message: m.message,
    is_pinned: m.isPinned,
    created_at: m.createdAt.toISOString(),
  }));
}

export async function sendChatMessage(input: { channel: string; message: string }) {
  const { session, profile } = await requireBusiness();
  // Derive sender from session; ignore any client-provided identity.
  const senderId = session.user.id;
  const senderName =
    [profile.firstName, profile.lastName].filter(Boolean).join(' ').trim() ||
    profile.fullName ||
    session.user.name ||
    'Unknown';

  await db.insert(staffMessages).values({
    channel: input.channel,
    senderId,
    senderName,
    message: input.message,
    isPinned: false,
  });
  revalidatePath('/dashboard/chat');
}

export async function togglePinChatMessage(id: string, isPinned: boolean) {
  const { businessId } = await requireBusiness();
  const userIds = await getBusinessUserIds(businessId);
  if (userIds.length === 0) return;
  await db
    .update(staffMessages)
    .set({ isPinned: !isPinned })
    .where(
      and(eq(staffMessages.id, id), inArray(staffMessages.senderId, userIds)),
    );
  revalidatePath('/dashboard/chat');
}

export async function deleteChatMessage(id: string) {
  const { businessId } = await requireBusiness();
  const userIds = await getBusinessUserIds(businessId);
  if (userIds.length === 0) return;
  await db
    .delete(staffMessages)
    .where(
      and(eq(staffMessages.id, id), inArray(staffMessages.senderId, userIds)),
    );
  revalidatePath('/dashboard/chat');
}
