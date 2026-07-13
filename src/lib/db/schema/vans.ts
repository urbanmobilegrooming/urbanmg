import { boolean, date, integer, numeric, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { businesses } from './business';
import { staff } from './staff';

export const vans = pgTable('vans', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  licensePlate: text('license_plate'),
  make: text('make'),
  model: text('model'),
  year: integer('year'),
  color: text('color'),
  currentMileage: integer('current_mileage'),
  lastOilChange: date('last_oil_change'),
  lastInspection: date('last_inspection'),
  insuranceExpiry: date('insurance_expiry'),
  status: text('status').notNull().default('active'),
  isActive: boolean('is_active').notNull().default(true),
  lastLat: numeric('last_lat', { precision: 10, scale: 7 }),
  lastLng: numeric('last_lng', { precision: 10, scale: 7 }),
  lastUpdated: timestamp('last_updated', { withTimezone: true }),
  businessId: uuid('business_id').references(() => businesses.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const fuelLogs = pgTable('fuel_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  vanId: uuid('van_id').notNull().references(() => vans.id, { onDelete: 'cascade' }),
  gallons: numeric('gallons', { precision: 10, scale: 2 }).notNull(),
  cost: numeric('cost', { precision: 10, scale: 2 }).notNull(),
  mileage: integer('mileage'),
  station: text('station'),
  date: date('date').notNull(),
  staffId: uuid('staff_id').references(() => staff.id, { onDelete: 'set null' }),
  businessId: uuid('business_id').references(() => businesses.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const vanMaintenance = pgTable('van_maintenance', {
  id: uuid('id').primaryKey().defaultRandom(),
  vanId: uuid('van_id').notNull().references(() => vans.id, { onDelete: 'cascade' }),
  type: text('type').notNull().default('other'),
  maintenanceType: text('maintenance_type'),
  description: text('description'),
  cost: numeric('cost', { precision: 10, scale: 2 }).notNull().default('0'),
  mileage: integer('mileage'),
  performedAt: date('performed_at').notNull(),
  nextDueAt: date('next_due_at'),
  notes: text('notes'),
  date: date('date'),
  businessId: uuid('business_id').references(() => businesses.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
