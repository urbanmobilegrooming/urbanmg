import { integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { clients } from './clients';
import { businesses } from './business';
import { appointments } from './appointments';

export const loyaltyAccounts = pgTable('loyalty_accounts', {
  id: uuid('id').primaryKey().defaultRandom(),
  clientId: uuid('client_id').notNull().references(() => clients.id, { onDelete: 'cascade' }).unique(),
  points: integer('points').notNull().default(0),
  businessId: uuid('business_id').references(() => businesses.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const loyaltyTransactions = pgTable('loyalty_transactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  clientId: uuid('client_id').notNull().references(() => clients.id, { onDelete: 'cascade' }),
  type: text('type').notNull().default('earned'),
  points: integer('points').notNull().default(0),
  description: text('description'),
  appointmentId: uuid('appointment_id').references(() => appointments.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
