import { boolean, jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { businesses } from './business';
import { clients } from './clients';

export const intakeSubmissions = pgTable('intake_submissions', {
  id: uuid('id').primaryKey().defaultRandom(),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  phone: text('phone'),
  email: text('email'),
  address: text('address'),
  city: text('city'),
  zip: text('zip'),
  preferredContact: text('preferred_contact'),
  referralSource: text('referral_source'),
  // [{ name, species, breed, weight_lbs, notes }]
  pets: jsonb('pets'),
  notes: text('notes'),
  status: text('status').notNull().default('pending'),
  clientId: uuid('client_id').references(() => clients.id, { onDelete: 'set null' }),
  reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
  businessId: uuid('business_id').references(() => businesses.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const leads = pgTable('leads', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  phone: text('phone'),
  email: text('email'),
  source: text('source').notNull().default('other'),
  status: text('status').notNull().default('new'),
  notes: text('notes'),
  clientId: uuid('client_id').references(() => clients.id, { onDelete: 'set null' }),
  lastContactedAt: timestamp('last_contacted_at', { withTimezone: true }),
  businessId: uuid('business_id').references(() => businesses.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const notifications = pgTable('notifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  type: text('type').notNull().default('system'),
  title: text('title').notNull(),
  body: text('body'),
  href: text('href'),
  isRead: boolean('is_read').notNull().default(false),
  businessId: uuid('business_id').references(() => businesses.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
