'use server';

import { and, desc, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { clients, reviewRequests, reviewSettings, satisfactionSurveys } from '@/lib/db/schema';
import { requireBusiness } from '@/lib/auth-server';

export async function getReviewSettings() {
  const { businessId } = await requireBusiness();
  const [row] = await db
    .select()
    .from(reviewSettings)
    .where(eq(reviewSettings.businessId, businessId))
    .limit(1);
  return row
    ? {
        id: row.id,
        auto_send: row.autoSend,
        delay_hours: row.delayHours,
        channel: row.channel,
        template: row.template,
        google_review_link: row.googleReviewLink,
      }
    : null;
}

export async function saveReviewSettings(input: {
  auto_send: boolean;
  delay_hours: number;
  channel: string;
  template: string;
  google_review_link: string;
}) {
  const { businessId } = await requireBusiness();
  const [existing] = await db
    .select()
    .from(reviewSettings)
    .where(eq(reviewSettings.businessId, businessId))
    .limit(1);
  if (existing) {
    await db
      .update(reviewSettings)
      .set({
        autoSend: input.auto_send,
        delayHours: input.delay_hours,
        channel: input.channel,
        template: input.template,
        googleReviewLink: input.google_review_link,
      })
      .where(eq(reviewSettings.id, existing.id));
  } else {
    await db.insert(reviewSettings).values({
      autoSend: input.auto_send,
      delayHours: input.delay_hours,
      channel: input.channel,
      template: input.template,
      googleReviewLink: input.google_review_link,
      businessId,
    });
  }
  revalidatePath('/dashboard/reviews');
}

export async function listReviewRequests() {
  const { businessId } = await requireBusiness();
  // review_requests has no businessId; restrict via client FK
  const rows = await db
    .select()
    .from(reviewRequests)
    .innerJoin(
      clients,
      and(eq(reviewRequests.clientId, clients.id), eq(clients.businessId, businessId)),
    )
    .orderBy(desc(reviewRequests.sentAt))
    .limit(200);
  return rows.map((r) => ({
    id: r.review_requests.id,
    sent_at: r.review_requests.sentAt.toISOString(),
    status: r.review_requests.status,
    channel: r.review_requests.channel,
    clients: r.clients
      ? { first_name: r.clients.firstName, last_name: r.clients.lastName, phone: r.clients.phone, email: r.clients.email }
      : null,
  }));
}

export async function logTestReview(input: { channel: string; body: string; recipient: string }) {
  // Test review is a synthetic record with no client; require business context
  // but no client assignment. We still scope by inserting without clientId,
  // and on listing we exclude orphan records (they won't appear in the
  // business-scoped listing). Mark explicitly as a test record.
  await requireBusiness();
  await db.insert(reviewRequests).values({
    channel: input.channel,
    status: 'sent',
    body: input.body,
    recipient: input.recipient,
    isTest: true,
  });
  revalidatePath('/dashboard/reviews');
}

// Surveys
export async function listSatisfactionSurveys() {
  const { businessId } = await requireBusiness();
  // satisfaction_surveys has no businessId; restrict via client FK
  const rows = await db
    .select()
    .from(satisfactionSurveys)
    .innerJoin(
      clients,
      and(
        eq(satisfactionSurveys.clientId, clients.id),
        eq(clients.businessId, businessId),
      ),
    )
    .orderBy(desc(satisfactionSurveys.createdAt))
    .limit(200);
  return rows.map((r) => ({
    id: r.satisfaction_surveys.id,
    created_at: r.satisfaction_surveys.createdAt.toISOString(),
    overall_rating: r.satisfaction_surveys.overallRating ?? 0,
    punctuality: r.satisfaction_surveys.punctuality ?? 0,
    quality: r.satisfaction_surveys.quality ?? 0,
    friendliness: r.satisfaction_surveys.friendliness ?? 0,
    would_recommend: (r.satisfaction_surveys.wouldRecommend ?? 'maybe') as 'yes' | 'no' | 'maybe',
    comments: r.satisfaction_surveys.comments,
    clients: r.clients ? { first_name: r.clients.firstName, last_name: r.clients.lastName } : null,
    appointments: null as { date: string; services: { name: string } | null } | null,
  }));
}

