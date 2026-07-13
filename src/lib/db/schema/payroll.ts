import { date, integer, numeric, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { businesses } from './business';
import { staff } from './staff';

export const payrollPeriods = pgTable('payroll_periods', {
  id: uuid('id').primaryKey().defaultRandom(),
  startDate: date('start_date').notNull(),
  endDate: date('end_date').notNull(),
  status: text('status').notNull().default('draft'),
  paidAt: timestamp('paid_at', { withTimezone: true }),
  businessId: uuid('business_id').references(() => businesses.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const payrollDeductions = pgTable('payroll_deductions', {
  id: uuid('id').primaryKey().defaultRandom(),
  staffId: uuid('staff_id').notNull().references(() => staff.id, { onDelete: 'restrict' }),
  periodYear: integer('period_year').notNull(),
  periodMonth: integer('period_month').notNull(),
  description: text('description').notNull(),
  amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
  businessId: uuid('business_id').references(() => businesses.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
