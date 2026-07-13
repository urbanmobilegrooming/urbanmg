import { date, pgTable, text, time, timestamp, uuid } from 'drizzle-orm/pg-core';
import { businesses } from './business';
import { clients } from './clients';
import { pets } from './pets';
import { services } from './services';
import { staff } from './staff';

export const waitList = pgTable('wait_list', {
  id: uuid('id').primaryKey().defaultRandom(),
  clientId: uuid('client_id').notNull().references(() => clients.id, { onDelete: 'cascade' }),
  petId: uuid('pet_id').references(() => pets.id, { onDelete: 'set null' }),
  serviceId: uuid('service_id').references(() => services.id, { onDelete: 'set null' }),
  preferredStaffId: uuid('preferred_staff_id').references(() => staff.id, { onDelete: 'set null' }),
  preferredDateStart: date('preferred_date_start'),
  preferredDateEnd: date('preferred_date_end'),
  preferredTimeStart: time('preferred_time_start'),
  preferredTimeEnd: time('preferred_time_end'),
  notes: text('notes'),
  status: text('status').notNull().default('waiting'),
  businessId: uuid('business_id').references(() => businesses.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
