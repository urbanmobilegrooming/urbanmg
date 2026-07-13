import { boolean, integer, numeric, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { businesses } from './business';
import { staff } from './staff';

export const trainingModules = pgTable('training_modules', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  description: text('description'),
  category: text('category').notNull().default('grooming'),
  durationMinutes: integer('duration_minutes').notNull().default(30),
  isActive: boolean('is_active').notNull().default(true),
  content: text('content'),
  businessId: uuid('business_id').references(() => businesses.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const staffTrainingProgress = pgTable('staff_training_progress', {
  id: uuid('id').primaryKey().defaultRandom(),
  staffId: uuid('staff_id').notNull().references(() => staff.id, { onDelete: 'cascade' }),
  moduleId: uuid('module_id').notNull().references(() => trainingModules.id, { onDelete: 'cascade' }),
  status: text('status').notNull().default('not_started'),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  progressPercent: numeric('progress_percent', { precision: 5, scale: 2 }).notNull().default('0'),
});
