import { date, integer, jsonb, numeric, pgTable, text, time, timestamp, uuid } from 'drizzle-orm/pg-core';
import { businesses } from './business';
import { clients } from './clients';
import { pets } from './pets';
import { services } from './services';
import { staff } from './staff';

export const appointments = pgTable('appointments', {
  id: uuid('id').primaryKey().defaultRandom(),
  date: date('date').notNull(),
  startTime: time('start_time').notNull(),
  endTime: time('end_time'),
  status: text('status').notNull().default('scheduled'),
  van: text('van'),
  price: numeric('price', { precision: 10, scale: 2 }),
  notes: text('notes'),
  address: text('address'),
  city: text('city'),
  state: text('state'),
  zip: text('zip'),
  paymentStatus: text('payment_status').notNull().default('pending'),
  paymentMethod: text('payment_method'),
  checkinAt: timestamp('checkin_at', { withTimezone: true }),
  checkoutAt: timestamp('checkout_at', { withTimezone: true }),
  reportNotes: text('report_notes'),
  clientId: uuid('client_id').references(() => clients.id, { onDelete: 'cascade' }),
  petId: uuid('pet_id').references(() => pets.id, { onDelete: 'set null' }),
  serviceId: uuid('service_id').references(() => services.id, { onDelete: 'set null' }),
  staffId: uuid('staff_id').references(() => staff.id, { onDelete: 'set null' }),
  businessId: uuid('business_id').references(() => businesses.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const appointmentServices = pgTable('appointment_services', {
  id: uuid('id').primaryKey().defaultRandom(),
  appointmentId: uuid('appointment_id').notNull().references(() => appointments.id, { onDelete: 'cascade' }),
  serviceId: uuid('service_id').references(() => services.id, { onDelete: 'set null' }),
  staffId: uuid('staff_id').references(() => staff.id, { onDelete: 'set null' }),
  petId: uuid('pet_id').references(() => pets.id, { onDelete: 'set null' }),
  durationMinutes: integer('duration_minutes'),
  price: numeric('price', { precision: 10, scale: 2 }).notNull().default('0'),
  status: text('status'),
  notes: text('notes'),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const appointmentRepeatRules = pgTable('appointment_repeat_rules', {
  id: uuid('id').primaryKey().defaultRandom(),
  appointmentId: uuid('appointment_id').notNull().references(() => appointments.id, { onDelete: 'cascade' }),
  frequency: text('frequency').notNull(),
  endDate: date('end_date'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const groomingReportCards = pgTable('grooming_report_cards', {
  id: uuid('id').primaryKey().defaultRandom(),
  appointmentId: uuid('appointment_id').notNull().references(() => appointments.id, { onDelete: 'cascade' }),
  petId: uuid('pet_id').references(() => pets.id, { onDelete: 'cascade' }),
  staffId: uuid('staff_id').references(() => staff.id, { onDelete: 'set null' }),
  groomingNotes: text('grooming_notes'),
  behavioralNotes: text('behavioral_notes'),
  coatCondition: integer('coat_condition'),
  skinHealth: integer('skin_health'),
  earCleanliness: integer('ear_cleanliness'),
  nailCondition: integer('nail_condition'),
  teethHealth: integer('teeth_health'),
  behavior: integer('behavior'),
  servicesPerformed: jsonb('services_performed'),
  groomerNotes: text('groomer_notes'),
  recommendations: text('recommendations'),
  issuesFound: text('issues_found'),
  nextVisitDate: date('next_visit_date'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
