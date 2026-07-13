import { boolean, integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { businesses } from './business';

export const clients = pgTable('clients', {
  id: uuid('id').primaryKey().defaultRandom(),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  phone: text('phone'),
  phoneSecondary: text('phone_secondary'),
  email: text('email'),
  address: text('address'),
  city: text('city'),
  state: text('state'),
  zip: text('zip'),
  notes: text('notes'),
  loyaltyPoints: integer('loyalty_points').notNull().default(0),
  isActive: boolean('is_active').notNull().default(true),
  businessId: uuid('business_id').references(() => businesses.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
