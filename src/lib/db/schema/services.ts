import { boolean, integer, numeric, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { businesses } from './business';

export const serviceCategories = pgTable('service_categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  description: text('description'),
  color: text('color').notNull().default('#f2c037'),
  sortOrder: integer('sort_order').notNull().default(0),
  businessId: uuid('business_id').references(() => businesses.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const services = pgTable('services', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  description: text('description'),
  durationMinutes: integer('duration_minutes').notNull().default(60),
  basePrice: numeric('base_price', { precision: 10, scale: 2 }),
  isActive: boolean('is_active').notNull().default(true),
  categoryId: uuid('category_id').references(() => serviceCategories.id, { onDelete: 'set null' }),
  businessId: uuid('business_id').references(() => businesses.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const serviceAddons = pgTable('service_addons', {
  id: uuid('id').primaryKey().defaultRandom(),
  serviceId: uuid('service_id').references(() => services.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  price: numeric('price', { precision: 10, scale: 2 }).notNull(),
  durationMinutes: integer('duration_minutes'),
  isActive: boolean('is_active').notNull().default(true),
  businessId: uuid('business_id').references(() => businesses.id, { onDelete: 'cascade' }),
});

export const servicePricing = pgTable('service_pricing', {
  id: uuid('id').primaryKey().defaultRandom(),
  serviceId: uuid('service_id').notNull().references(() => services.id, { onDelete: 'cascade' }),
  sizeCategory: text('size_category').notNull(),
  price: numeric('price', { precision: 10, scale: 2 }).notNull(),
  businessId: uuid('business_id').references(() => businesses.id, { onDelete: 'cascade' }),
});
