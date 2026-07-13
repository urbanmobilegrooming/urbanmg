import { boolean, numeric, pgTable, text, time, timestamp, uuid, integer } from 'drizzle-orm/pg-core';
import { profiles } from './auth';
import { businesses } from './business';

export const staff = pgTable('staff', {
  id: uuid('id').primaryKey().defaultRandom(),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull().default(''),
  color: text('color').notNull().default('#f2c037'),
  role: text('role').notNull().default('groomer'),
  commissionRate: numeric('commission_rate', { precision: 5, scale: 2 }).notNull().default('0'),
  phone: text('phone'),
  email: text('email'),
  isActive: boolean('is_active').notNull().default(true),
  businessId: uuid('business_id').references(() => businesses.id, { onDelete: 'cascade' }),
  profileId: uuid('profile_id').references(() => profiles.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const staffSchedules = pgTable('staff_schedules', {
  id: uuid('id').primaryKey().defaultRandom(),
  staffId: uuid('staff_id').notNull().references(() => staff.id, { onDelete: 'cascade' }),
  dayOfWeek: integer('day_of_week').notNull(),
  startTime: time('start_time').notNull(),
  endTime: time('end_time').notNull(),
  isAvailable: boolean('is_available').notNull().default(true),
  businessId: uuid('business_id').references(() => businesses.id, { onDelete: 'cascade' }),
});

export const staffBlockTimes = pgTable('staff_block_times', {
  id: uuid('id').primaryKey().defaultRandom(),
  staffId: uuid('staff_id').notNull().references(() => staff.id, { onDelete: 'cascade' }),
  date: text('date').notNull(),
  startTime: time('start_time').notNull(),
  endTime: time('end_time').notNull(),
  description: text('description'),
  businessId: uuid('business_id').references(() => businesses.id, { onDelete: 'cascade' }),
});

export const staffMessages = pgTable('staff_messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  staffId: uuid('staff_id').references(() => staff.id, { onDelete: 'cascade' }),
  channel: text('channel').notNull().default('general'),
  senderId: text('sender_id'),
  senderName: text('sender_name').notNull().default('Unknown'),
  message: text('message').notNull(),
  isPinned: boolean('is_pinned').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const clockRecords = pgTable('clock_records', {
  id: uuid('id').primaryKey().defaultRandom(),
  staffId: uuid('staff_id').notNull().references(() => staff.id, { onDelete: 'cascade' }),
  clockIn: timestamp('clock_in', { withTimezone: true }).notNull(),
  clockOut: timestamp('clock_out', { withTimezone: true }),
  totalHours: numeric('total_hours', { precision: 6, scale: 2 }),
  notes: text('notes'),
  businessId: uuid('business_id').references(() => businesses.id, { onDelete: 'cascade' }),
});
