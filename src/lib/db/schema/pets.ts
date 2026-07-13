import { boolean, date, integer, jsonb, numeric, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { businesses } from './business';
import { clients } from './clients';

export const pets = pgTable('pets', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  species: text('species'),
  breed: text('breed'),
  color: text('color'),
  weightLbs: numeric('weight_lbs', { precision: 6, scale: 2 }),
  dateOfBirth: date('date_of_birth'),
  gender: text('gender'),
  isNeutered: boolean('is_neutered').notNull().default(false),
  temperament: text('temperament'),
  groomingNotes: text('grooming_notes'),
  groomingFrequencyWeeks: integer('grooming_frequency_weeks'),
  medicalNotes: text('medical_notes'),
  isActive: boolean('is_active').notNull().default(true),
  clientId: uuid('client_id').references(() => clients.id, { onDelete: 'cascade' }),
  businessId: uuid('business_id').references(() => businesses.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const petPhotos = pgTable('pet_photos', {
  id: uuid('id').primaryKey().defaultRandom(),
  petId: uuid('pet_id').notNull().references(() => pets.id, { onDelete: 'cascade' }),
  photoUrl: text('photo_url').notNull(),
  photoType: text('photo_type').notNull().default('general'),
  caption: text('caption'),
  appointmentId: uuid('appointment_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const petVaccines = pgTable('pet_vaccines', {
  id: uuid('id').primaryKey().defaultRandom(),
  petId: uuid('pet_id').notNull().references(() => pets.id, { onDelete: 'cascade' }),
  vaccineName: text('vaccine_name').notNull(),
  dateGiven: date('date_given'),
  expiryDate: date('expiry_date'),
  vetName: text('vet_name'),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const petMatchProfiles = pgTable('pet_match_profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  petId: uuid('pet_id').notNull().references(() => pets.id, { onDelete: 'cascade' }).unique(),
  bio: text('bio'),
  lookingFor: text('looking_for').notNull().default('playmate'),
  isActive: boolean('is_active').notNull().default(true),
  profileData: jsonb('profile_data'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const petMatches = pgTable('pet_matches', {
  id: uuid('id').primaryKey().defaultRandom(),
  petId: uuid('pet_id').notNull().references(() => pets.id, { onDelete: 'cascade' }),
  targetPetId: uuid('target_pet_id').notNull().references(() => pets.id, { onDelete: 'cascade' }),
  action: text('action').notNull().default('like'),
  matchScore: numeric('match_score', { precision: 5, scale: 2 }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
