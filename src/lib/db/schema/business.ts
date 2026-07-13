import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const businesses = pgTable('businesses', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  slug: text('slug'),
  ownerId: text('owner_id'),
  phone: text('phone'),
  email: text('email'),
  website: text('website'),
  address: text('address'),
  city: text('city'),
  state: text('state'),
  zip: text('zip'),
  timezone: text('timezone').notNull().default('America/New_York'),
  serviceAreas: text('service_areas').array(),
  subscriptionPlan: text('subscription_plan').notNull().default('trial'),
  trialEndsAt: timestamp('trial_ends_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const companySettings = pgTable('company_settings', {
  id: uuid('id').primaryKey().defaultRandom(),
  businessId: uuid('business_id').notNull().references(() => businesses.id, { onDelete: 'cascade' }),
  settingKey: text('setting_key').notNull(),
  settingValue: text('setting_value'),
});
