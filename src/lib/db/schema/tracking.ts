import { integer, numeric, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { appointments } from './appointments';
import { businesses } from './business';
import { staff } from './staff';

export const trackingSessions = pgTable('tracking_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  appointmentId: uuid('appointment_id').notNull().references(() => appointments.id, { onDelete: 'cascade' }),
  staffId: uuid('staff_id').references(() => staff.id, { onDelete: 'set null' }),
  shareToken: text('share_token').notNull().unique(),
  status: text('status').notNull().default('active'),
  lastLat: numeric('last_lat', { precision: 10, scale: 7 }),
  lastLng: numeric('last_lng', { precision: 10, scale: 7 }),
  lastPingAt: timestamp('last_ping_at', { withTimezone: true }),
  destinationLat: numeric('destination_lat', { precision: 10, scale: 7 }),
  destinationLng: numeric('destination_lng', { precision: 10, scale: 7 }),
  etaMinutes: integer('eta_minutes'),
  startedAt: timestamp('started_at', { withTimezone: true }).notNull().defaultNow(),
  endedAt: timestamp('ended_at', { withTimezone: true }),
  businessId: uuid('business_id').references(() => businesses.id, { onDelete: 'cascade' }),
});
