import { boolean, integer, jsonb, numeric, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { appointments } from './appointments';
import { businesses } from './business';
import { clients } from './clients';
import { messageTemplates } from './messaging';

export const referralSettings = pgTable('referral_settings', {
  id: uuid('id').primaryKey().defaultRandom(),
  businessId: uuid('business_id').references(() => businesses.id, { onDelete: 'cascade' }),
  enabled: boolean('enabled').notNull().default(false),
  rewardAmount: numeric('reward_amount', { precision: 10, scale: 2 }),
  pointsPerDollar: integer('points_per_dollar').notNull().default(10),
  redemptionRate: integer('redemption_rate').notNull().default(100),
  welcomeBonus: integer('welcome_bonus').notNull().default(250),
});

export const referrals = pgTable('referrals', {
  id: uuid('id').primaryKey().defaultRandom(),
  referrerId: uuid('referrer_id').references(() => clients.id, { onDelete: 'cascade' }),
  referredId: uuid('referred_id').references(() => clients.id, { onDelete: 'cascade' }),
  referrerName: text('referrer_name'),
  referredName: text('referred_name'),
  referredEmail: text('referred_email'),
  bonusPoints: integer('bonus_points').notNull().default(0),
  status: text('status').notNull().default('pending'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const reminderSettings = pgTable('reminder_settings', {
  id: uuid('id').primaryKey().defaultRandom(),
  businessId: uuid('business_id').references(() => businesses.id, { onDelete: 'cascade' }),
  type: text('type').notNull(),
  enabled: boolean('enabled').notNull().default(true),
  hoursOffset: integer('hours_offset').notNull().default(0),
  templateId: uuid('template_id').references(() => messageTemplates.id, { onDelete: 'set null' }),
});

export const reviewSettings = pgTable('review_settings', {
  id: uuid('id').primaryKey().defaultRandom(),
  businessId: uuid('business_id').references(() => businesses.id, { onDelete: 'cascade' }),
  autoSend: boolean('auto_send').notNull().default(false),
  delayHours: integer('delay_hours').notNull().default(1),
  channel: text('channel').notNull().default('whatsapp'),
  template: text('template'),
  googleReviewLink: text('google_review_link'),
});

export const reviewRequests = pgTable('review_requests', {
  id: uuid('id').primaryKey().defaultRandom(),
  appointmentId: uuid('appointment_id').references(() => appointments.id, { onDelete: 'cascade' }),
  clientId: uuid('client_id').references(() => clients.id, { onDelete: 'cascade' }),
  channel: text('channel').notNull().default('whatsapp'),
  status: text('status').notNull().default('sent'),
  body: text('body'),
  recipient: text('recipient'),
  isTest: boolean('is_test').notNull().default(false),
  sentAt: timestamp('sent_at', { withTimezone: true }).notNull().defaultNow(),
});

export const satisfactionSurveys = pgTable('satisfaction_surveys', {
  id: uuid('id').primaryKey().defaultRandom(),
  clientId: uuid('client_id').references(() => clients.id, { onDelete: 'cascade' }),
  appointmentId: uuid('appointment_id').references(() => appointments.id, { onDelete: 'set null' }),
  overallRating: integer('overall_rating'),
  punctuality: integer('punctuality'),
  quality: integer('quality'),
  friendliness: integer('friendliness'),
  wouldRecommend: text('would_recommend'),
  rating: integer('rating'),
  comments: text('comments'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const surveys = pgTable('surveys', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  questions: jsonb('questions'),
  businessId: uuid('business_id').references(() => businesses.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const marketingCampaigns = pgTable('marketing_campaigns', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  description: text('description'),
  discount: text('discount'),
  audience: text('audience').notNull().default('all'),
  startDate: text('start_date'),
  endDate: text('end_date'),
  color: text('color'),
  icon: text('icon'),
  businessId: uuid('business_id').references(() => businesses.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const remindersSent = pgTable('reminders_sent', {
  id: uuid('id').primaryKey().defaultRandom(),
  entityId: uuid('entity_id').notNull(),
  type: text('type').notNull(),
  sentAt: timestamp('sent_at', { withTimezone: true }).notNull().defaultNow(),
});
