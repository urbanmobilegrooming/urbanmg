import { boolean, date, integer, numeric, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { appointments, appointmentServices } from './appointments';
import { businesses } from './business';
import { clients } from './clients';
import { staff } from './staff';

export const invoices = pgTable('invoices', {
  id: uuid('id').primaryKey().defaultRandom(),
  invoiceNumber: text('invoice_number').notNull().unique(),
  appointmentId: uuid('appointment_id').references(() => appointments.id, { onDelete: 'set null' }),
  clientId: uuid('client_id').references(() => clients.id, { onDelete: 'set null' }),
  subtotal: numeric('subtotal', { precision: 10, scale: 2 }).notNull().default('0'),
  tax: numeric('tax', { precision: 10, scale: 2 }).notNull().default('0'),
  total: numeric('total', { precision: 10, scale: 2 }).notNull().default('0'),
  status: text('status').notNull().default('draft'),
  paymentMethod: text('payment_method'),
  paidAmount: numeric('paid_amount', { precision: 10, scale: 2 }).notNull().default('0'),
  dueDate: date('due_date'),
  paidAt: timestamp('paid_at', { withTimezone: true }),
  notes: text('notes'),
  businessId: uuid('business_id').references(() => businesses.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const invoiceItems = pgTable('invoice_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  invoiceId: uuid('invoice_id').notNull().references(() => invoices.id, { onDelete: 'cascade' }),
  appointmentServiceId: uuid('appointment_service_id').references(() => appointmentServices.id, { onDelete: 'set null' }),
  description: text('description').notNull(),
  quantity: numeric('quantity', { precision: 10, scale: 2 }).notNull().default('1'),
  unitPrice: numeric('unit_price', { precision: 10, scale: 2 }).notNull(),
  discountAmount: numeric('discount_amount', { precision: 10, scale: 2 }).notNull().default('0'),
  taxAmount: numeric('tax_amount', { precision: 10, scale: 2 }).notNull().default('0'),
  total: numeric('total', { precision: 10, scale: 2 }).notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
});

export const invoicePayments = pgTable('invoice_payments', {
  id: uuid('id').primaryKey().defaultRandom(),
  invoiceId: uuid('invoice_id').notNull().references(() => invoices.id, { onDelete: 'cascade' }),
  amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
  paymentMethod: text('payment_method').notNull(),
  paidAt: timestamp('paid_at', { withTimezone: true }).notNull(),
  reference: text('reference'),
});

export const expenses = pgTable('expenses', {
  id: uuid('id').primaryKey().defaultRandom(),
  description: text('description').notNull(),
  amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
  category: text('category'),
  date: date('date').notNull(),
  van: text('van'),
  staffId: uuid('staff_id').references(() => staff.id, { onDelete: 'set null' }),
  businessId: uuid('business_id').references(() => businesses.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const tips = pgTable('tips', {
  id: uuid('id').primaryKey().defaultRandom(),
  appointmentId: uuid('appointment_id').references(() => appointments.id, { onDelete: 'set null' }),
  staffId: uuid('staff_id').references(() => staff.id, { onDelete: 'set null' }),
  amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const discountCodes = pgTable('discount_codes', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: text('code').notNull().unique(),
  type: text('type').notNull().default('percentage'),
  value: numeric('value', { precision: 10, scale: 2 }).notNull().default('0'),
  minOrderAmount: numeric('min_order_amount', { precision: 10, scale: 2 }).notNull().default('0'),
  maxUses: integer('max_uses'),
  usedCount: integer('used_count').notNull().default(0),
  validFrom: date('valid_from'),
  validUntil: date('valid_until'),
  isActive: boolean('is_active').notNull().default(true),
  businessId: uuid('business_id').references(() => businesses.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
