import { boolean, integer, numeric, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { businesses } from './business';

export const products = pgTable('products', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  description: text('description'),
  sku: text('sku'),
  price: numeric('price', { precision: 10, scale: 2 }).notNull(),
  cost: numeric('cost', { precision: 10, scale: 2 }),
  stock: integer('stock').notNull().default(0),
  category: text('category'),
  isActive: boolean('is_active').notNull().default(true),
  businessId: uuid('business_id').references(() => businesses.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const inventoryItems = pgTable('inventory_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  category: text('category').notNull().default('Other'),
  currentStock: numeric('current_stock', { precision: 10, scale: 2 }).notNull().default('0'),
  minStock: numeric('min_stock', { precision: 10, scale: 2 }).notNull().default('0'),
  unitCost: numeric('unit_cost', { precision: 10, scale: 2 }).notNull().default('0'),
  unit: text('unit').notNull().default('unit'),
  supplier: text('supplier'),
  vanId: uuid('van_id'),
  quantity: integer('quantity').notNull().default(0),
  unitPrice: numeric('unit_price', { precision: 10, scale: 2 }),
  isActive: boolean('is_active').notNull().default(true),
  businessId: uuid('business_id').references(() => businesses.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const inventoryTransactions = pgTable('inventory_transactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  itemId: uuid('item_id').notNull().references(() => inventoryItems.id, { onDelete: 'cascade' }),
  type: text('type').notNull(),
  transactionType: text('transaction_type'),
  quantity: numeric('quantity', { precision: 10, scale: 2 }).notNull(),
  notes: text('notes'),
  reason: text('reason'),
  businessId: uuid('business_id').references(() => businesses.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
