import { boolean, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { businesses } from './business';
import { clients } from './clients';

export const messageTemplates = pgTable('message_templates', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  body: text('body').notNull(),
  type: text('type').notNull().default('custom'),
  channel: text('channel').notNull().default('sms'),
  businessId: uuid('business_id').references(() => businesses.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const messages = pgTable('messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  clientId: uuid('client_id').references(() => clients.id, { onDelete: 'cascade' }),
  templateId: uuid('template_id').references(() => messageTemplates.id, { onDelete: 'set null' }),
  body: text('body').notNull(),
  direction: text('direction').notNull().default('outbound'),
  status: text('status').notNull().default('sent'),
  channel: text('channel').notNull().default('sms'),
  sentAt: timestamp('sent_at', { withTimezone: true }).defaultNow(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const agreementTemplates = pgTable('agreement_templates', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  body: text('body').notNull(),
  requiresSignature: boolean('requires_signature').notNull().default(true),
  businessId: uuid('business_id').references(() => businesses.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const clientAgreements = pgTable('client_agreements', {
  id: uuid('id').primaryKey().defaultRandom(),
  clientId: uuid('client_id').notNull().references(() => clients.id, { onDelete: 'cascade' }),
  templateId: uuid('template_id').references(() => agreementTemplates.id, { onDelete: 'set null' }),
  signedAt: timestamp('signed_at', { withTimezone: true }),
  signatureUrl: text('signature_url'),
  status: text('status').notNull().default('pending'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
