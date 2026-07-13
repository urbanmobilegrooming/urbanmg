import { NextResponse } from 'next/server';
import { and, eq, gte, inArray, lte } from 'drizzle-orm';
import { db } from '@/lib/db';
import {
  appointments,
  clients,
  messages,
  messageTemplates,
  pets,
  petVaccines,
  reminderSettings,
  remindersSent,
} from '@/lib/db/schema';
import { sendSms, sendWhatsApp } from '@/lib/messaging';

export const dynamic = 'force-dynamic';

const twilioReady = () =>
  !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_FROM);

function fill(template: string, vars: Record<string, string>) {
  return Object.entries(vars).reduce(
    (t, [k, v]) => t.replaceAll(`{${k}}`, v).replaceAll(`{{${k}}}`, v),
    template,
  );
}

const DEFAULTS: Record<string, string> = {
  reminder_24h:
    'Hi {client}! Reminder: {pet} has a grooming appointment tomorrow at {time}. Reply here if you need to reschedule. — Urban Mobile Grooming',
  reminder_1h:
    'Hi {client}! Your groomer is scheduled to arrive around {time} today for {pet}. See you soon! — Urban Mobile Grooming',
  followup:
    'Hi {client}! Thanks for trusting us with {pet} today. How did we do? We would love your feedback. — Urban Mobile Grooming',
  vaccine_expiry:
    'Hi {client}! A friendly reminder that {pet}\'s {vaccine} vaccine expires on {date}. — Urban Mobile Grooming',
};

async function alreadySent(entityId: string, type: string) {
  const [row] = await db
    .select({ id: remindersSent.id })
    .from(remindersSent)
    .where(and(eq(remindersSent.entityId, entityId), eq(remindersSent.type, type)))
    .limit(1);
  return !!row;
}

async function dispatch(
  phone: string,
  body: string,
  channel: string,
  clientId: string,
  entityId: string,
  type: string,
) {
  const result = channel === 'sms' ? await sendSms(phone, body) : await sendWhatsApp(phone, body);
  if (result.sent) {
    await db.insert(remindersSent).values({ entityId, type }).onConflictDoNothing();
    await db.insert(messages).values({
      clientId,
      body,
      channel,
      direction: 'outbound',
      status: 'sent',
      sentAt: new Date(),
    });
    return true;
  }
  return false;
}

export async function GET(req: Request) {
  const auth = req.headers.get('authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  if (!twilioReady()) {
    return NextResponse.json({ ok: true, skipped: 'twilio_not_configured' });
  }

  const settings = await db.select().from(reminderSettings).where(eq(reminderSettings.enabled, true));
  if (!settings.length) return NextResponse.json({ ok: true, sent: 0, reason: 'no_settings' });

  const templateIds = settings.map((s) => s.templateId).filter((t): t is string => !!t);
  const templates = templateIds.length
    ? await db.select().from(messageTemplates).where(inArray(messageTemplates.id, templateIds))
    : [];

  const now = new Date();
  let sent = 0;

  for (const setting of settings) {
    const tpl = templates.find((t) => t.id === setting.templateId);
    const channel = tpl?.channel ?? 'whatsapp';
    const bodyTemplate = tpl?.body ?? DEFAULTS[setting.type];
    if (!bodyTemplate) continue;

    if (setting.type === 'reminder_24h' || setting.type === 'reminder_1h') {
      // hours_offset negativo = horas antes de la cita
      const target = new Date(now.getTime() + Math.abs(setting.hoursOffset) * 3600000);
      const windowEnd = new Date(target.getTime() + 3600000); // corre cada hora
      const dateStr = target.toISOString().split('T')[0];
      const rows = await db
        .select({ apt: appointments, client: clients, pet: pets })
        .from(appointments)
        .innerJoin(clients, eq(appointments.clientId, clients.id))
        .leftJoin(pets, eq(appointments.petId, pets.id))
        .where(and(eq(appointments.date, dateStr), inArray(appointments.status, ['scheduled', 'confirmed'])));
      for (const r of rows) {
        const aptAt = new Date(`${r.apt.date}T${r.apt.startTime}`);
        if (aptAt < target || aptAt >= windowEnd) continue;
        if (!r.client.phone) continue;
        if (await alreadySent(r.apt.id, setting.type)) continue;
        const body = fill(bodyTemplate, {
          client: r.client.firstName,
          pet: r.pet?.name ?? 'your pet',
          time: r.apt.startTime.slice(0, 5),
          date: r.apt.date,
        });
        if (await dispatch(r.client.phone, body, channel, r.client.id, r.apt.id, setting.type)) sent++;
      }
    }

    if (setting.type === 'followup') {
      // horas después de completada
      const cutoffLow = new Date(now.getTime() - (setting.hoursOffset + 1) * 3600000);
      const cutoffHigh = new Date(now.getTime() - setting.hoursOffset * 3600000);
      const rows = await db
        .select({ apt: appointments, client: clients, pet: pets })
        .from(appointments)
        .innerJoin(clients, eq(appointments.clientId, clients.id))
        .leftJoin(pets, eq(appointments.petId, pets.id))
        .where(eq(appointments.status, 'completed'));
      for (const r of rows) {
        const doneAt = r.apt.checkoutAt ?? null;
        if (!doneAt || doneAt < cutoffLow || doneAt >= cutoffHigh) continue;
        if (!r.client.phone) continue;
        if (await alreadySent(r.apt.id, 'followup')) continue;
        const body = fill(bodyTemplate, {
          client: r.client.firstName,
          pet: r.pet?.name ?? 'your pet',
          time: r.apt.startTime.slice(0, 5),
          date: r.apt.date,
        });
        if (await dispatch(r.client.phone, body, channel, r.client.id, r.apt.id, 'followup')) sent++;
      }
    }

    if (setting.type === 'vaccine_expiry') {
      const daysAhead = Math.round(Math.abs(setting.hoursOffset) / 24) || 7;
      const from = now.toISOString().split('T')[0];
      const to = new Date(now.getTime() + daysAhead * 86400000).toISOString().split('T')[0];
      const rows = await db
        .select({ vac: petVaccines, pet: pets, client: clients })
        .from(petVaccines)
        .innerJoin(pets, eq(petVaccines.petId, pets.id))
        .innerJoin(clients, eq(pets.clientId, clients.id))
        .where(and(gte(petVaccines.expiryDate, from), lte(petVaccines.expiryDate, to)));
      for (const r of rows) {
        if (!r.client.phone) continue;
        if (await alreadySent(r.vac.id, 'vaccine_expiry')) continue;
        const body = fill(bodyTemplate, {
          client: r.client.firstName,
          pet: r.pet.name,
          vaccine: r.vac.vaccineName,
          date: r.vac.expiryDate ?? '',
        });
        if (await dispatch(r.client.phone, body, channel, r.client.id, r.vac.id, 'vaccine_expiry')) sent++;
      }
    }
  }

  return NextResponse.json({ ok: true, sent });
}
