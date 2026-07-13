'use server';

import { and, desc, eq, inArray } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import {
  agreementTemplates,
  clientAgreements,
  clients,
  messageTemplates,
  messages,
} from '@/lib/db/schema';
import { requireBusiness } from '@/lib/auth-server';
import { sendSms, sendWhatsApp } from '@/lib/messaging';

type ClientRow = typeof clients.$inferSelect;

const clientRef = (c: ClientRow | null) =>
  c
    ? { id: c.id, first_name: c.firstName, last_name: c.lastName, phone: c.phone }
    : null;

async function clientBelongsToBusiness(clientId: string, businessId: string) {
  const [c] = await db
    .select({ id: clients.id })
    .from(clients)
    .where(and(eq(clients.id, clientId), eq(clients.businessId, businessId)))
    .limit(1);
  return !!c;
}

// ----- message templates -----

export async function listMessageTemplates() {
  const { businessId } = await requireBusiness();
  const rows = await db
    .select()
    .from(messageTemplates)
    .where(eq(messageTemplates.businessId, businessId))
    .orderBy(messageTemplates.name);
  return rows.map((t) => ({
    id: t.id,
    name: t.name,
    body: t.body,
    type: t.type,
    channel: t.channel,
  }));
}

export async function createMessageTemplate(input: {
  name: string;
  body: string;
  type?: string;
  channel?: string;
}) {
  const { businessId } = await requireBusiness();
  await db.insert(messageTemplates).values({
    name: input.name,
    body: input.body,
    type: input.type ?? 'custom',
    channel: input.channel ?? 'sms',
    businessId,
  });
  revalidatePath('/dashboard/messages');
}

export async function deleteMessageTemplate(id: string) {
  const { businessId } = await requireBusiness();
  await db
    .delete(messageTemplates)
    .where(
      and(eq(messageTemplates.id, id), eq(messageTemplates.businessId, businessId)),
    );
  revalidatePath('/dashboard/messages');
}

// ----- messages -----

export async function listMessages(limit = 50) {
  const { businessId } = await requireBusiness();
  // messages has no businessId; filter via client FK
  const rows = await db
    .select()
    .from(messages)
    .innerJoin(
      clients,
      and(eq(messages.clientId, clients.id), eq(clients.businessId, businessId)),
    )
    .orderBy(desc(messages.sentAt))
    .limit(limit);
  return rows.map((r) => ({
    id: r.messages.id,
    client_id: r.messages.clientId,
    template_id: r.messages.templateId,
    body: r.messages.body,
    direction: r.messages.direction,
    status: r.messages.status,
    channel: r.messages.channel,
    sent_at: r.messages.sentAt,
    created_at: r.messages.createdAt,
    clients: clientRef(r.clients),
  }));
}

export async function sendMessage(input: {
  client_id: string;
  body: string;
  channel: string;
  template_id?: string | null;
}) {
  const { businessId } = await requireBusiness();
  if (!(await clientBelongsToBusiness(input.client_id, businessId))) {
    throw new Error('Client not found');
  }
  // Also verify template (if any) belongs to our business
  if (input.template_id) {
    const [tpl] = await db
      .select({ id: messageTemplates.id })
      .from(messageTemplates)
      .where(
        and(
          eq(messageTemplates.id, input.template_id),
          eq(messageTemplates.businessId, businessId),
        ),
      )
      .limit(1);
    if (!tpl) throw new Error('Template not found');
  }
  // envío real vía Twilio si está configurado; si no, queda registrado como pending
  let status = 'pending';
  const [client] = await db
    .select({ phone: clients.phone })
    .from(clients)
    .where(eq(clients.id, input.client_id))
    .limit(1);
  if (client?.phone) {
    const result =
      input.channel === 'whatsapp'
        ? await sendWhatsApp(client.phone, input.body)
        : await sendSms(client.phone, input.body);
    status = result.sent ? 'sent' : result.error === 'twilio_not_configured' ? 'pending' : 'failed';
  } else {
    status = 'failed';
  }

  await db.insert(messages).values({
    clientId: input.client_id,
    body: input.body,
    channel: input.channel,
    direction: 'outbound',
    status,
    templateId: input.template_id ?? null,
    sentAt: new Date(),
  });
  revalidatePath('/dashboard/messages');
  return { status };
}

// ----- agreement templates -----

export async function listAgreementTemplates() {
  const { businessId } = await requireBusiness();
  const rows = await db
    .select()
    .from(agreementTemplates)
    .where(eq(agreementTemplates.businessId, businessId))
    .orderBy(agreementTemplates.name);
  return rows.map((t) => ({
    id: t.id,
    name: t.name,
    body: t.body,
    requires_signature: t.requiresSignature,
    created_at: t.createdAt,
  }));
}

export async function createAgreementTemplate(input: {
  name: string;
  body: string;
  requires_signature?: boolean;
}) {
  const { businessId } = await requireBusiness();
  await db.insert(agreementTemplates).values({
    name: input.name,
    body: input.body,
    requiresSignature: input.requires_signature ?? true,
    businessId,
  });
  revalidatePath('/dashboard/agreements');
}

export async function deleteAgreementTemplate(id: string) {
  const { businessId } = await requireBusiness();
  await db
    .delete(agreementTemplates)
    .where(
      and(eq(agreementTemplates.id, id), eq(agreementTemplates.businessId, businessId)),
    );
  revalidatePath('/dashboard/agreements');
}

// ----- client agreements -----

export async function listClientAgreements(limit = 50) {
  const { businessId } = await requireBusiness();
  // client_agreements has no businessId; filter via client FK
  const rows = await db
    .select()
    .from(clientAgreements)
    .innerJoin(
      clients,
      and(
        eq(clientAgreements.clientId, clients.id),
        eq(clients.businessId, businessId),
      ),
    )
    .leftJoin(agreementTemplates, eq(clientAgreements.templateId, agreementTemplates.id))
    .orderBy(desc(clientAgreements.createdAt))
    .limit(limit);
  return rows.map((r) => ({
    id: r.client_agreements.id,
    client_id: r.client_agreements.clientId,
    template_id: r.client_agreements.templateId,
    signed_at: r.client_agreements.signedAt,
    signature_url: r.client_agreements.signatureUrl,
    status: r.client_agreements.status,
    created_at: r.client_agreements.createdAt,
    clients: clientRef(r.clients),
    agreement_templates: r.agreement_templates
      ? {
          id: r.agreement_templates.id,
          name: r.agreement_templates.name,
        }
      : null,
  }));
}

export async function createClientAgreement(input: {
  client_id: string;
  template_id: string;
}) {
  const { businessId } = await requireBusiness();
  if (!(await clientBelongsToBusiness(input.client_id, businessId))) {
    throw new Error('Client not found');
  }
  const [tpl] = await db
    .select({ id: agreementTemplates.id })
    .from(agreementTemplates)
    .where(
      and(
        eq(agreementTemplates.id, input.template_id),
        eq(agreementTemplates.businessId, businessId),
      ),
    )
    .limit(1);
  if (!tpl) throw new Error('Template not found');

  await db.insert(clientAgreements).values({
    clientId: input.client_id,
    templateId: input.template_id,
  });
  revalidatePath('/dashboard/agreements');
}

export async function markAgreementSigned(id: string) {
  const { businessId } = await requireBusiness();
  // Verify agreement is for a client in our business
  const businessClients = await db
    .select({ id: clients.id })
    .from(clients)
    .where(eq(clients.businessId, businessId));
  const clientIds = businessClients.map((c) => c.id);
  if (!clientIds.length) return;
  await db
    .update(clientAgreements)
    .set({ status: 'signed', signedAt: new Date() })
    .where(
      and(
        eq(clientAgreements.id, id),
        inArray(clientAgreements.clientId, clientIds),
      ),
    );
  revalidatePath('/dashboard/agreements');
}
