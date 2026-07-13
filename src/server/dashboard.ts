'use server';

import { and, count, eq, gte, lte, lt, ne, inArray } from 'drizzle-orm';
import { db } from '@/lib/db';
import {
  appointments,
  clients,
  expenses,
  petVaccines,
  pets,
  services,
  staff,
  waitList,
} from '@/lib/db/schema';
import { requireBusiness } from '@/lib/auth-server';

export type DashboardData = Awaited<ReturnType<typeof getDashboardData>>;

export async function getDashboardData() {
  const { businessId } = await requireBusiness();
  const today = new Date().toISOString().split('T')[0];
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
  const prevFirst = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0];
  const prevLast = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0];

  // Pre-fetch pet IDs in our business for vaccine query (pet_vaccines has no
  // businessId; we filter via the pet FK).
  const businessPetIds = await db
    .select({ id: pets.id })
    .from(pets)
    .where(eq(pets.businessId, businessId));
  const petIdList = businessPetIds.map((p) => p.id);

  const [
    [{ value: clientCount }],
    [{ value: petCount }],
    [{ value: serviceCount }],
    [{ value: appointmentsTodayCount }],
    [{ value: staffCount }],
    [{ value: waitListCount }],
    [{ value: upcomingAppts }],
    overdueVaccinesRes,
  ] = await Promise.all([
    db
      .select({ value: count() })
      .from(clients)
      .where(and(eq(clients.businessId, businessId), eq(clients.isActive, true))),
    db
      .select({ value: count() })
      .from(pets)
      .where(and(eq(pets.businessId, businessId), eq(pets.isActive, true))),
    db
      .select({ value: count() })
      .from(services)
      .where(and(eq(services.businessId, businessId), eq(services.isActive, true))),
    db
      .select({ value: count() })
      .from(appointments)
      .where(
        and(
          eq(appointments.businessId, businessId),
          eq(appointments.date, today),
          ne(appointments.status, 'cancelled'),
        ),
      ),
    db
      .select({ value: count() })
      .from(staff)
      .where(and(eq(staff.businessId, businessId), eq(staff.isActive, true))),
    db
      .select({ value: count() })
      .from(waitList)
      .where(and(eq(waitList.businessId, businessId), eq(waitList.status, 'waiting'))),
    db
      .select({ value: count() })
      .from(appointments)
      .where(
        and(
          eq(appointments.businessId, businessId),
          gte(appointments.date, today),
          ne(appointments.status, 'cancelled'),
        ),
      ),
    petIdList.length
      ? db
          .select({ value: count() })
          .from(petVaccines)
          .where(
            and(inArray(petVaccines.petId, petIdList), lt(petVaccines.expiryDate, today)),
          )
      : Promise.resolve([{ value: 0 }] as { value: number }[]),
  ]);
  const overdueVaccines = overdueVaccinesRes[0]?.value ?? 0;

  const todayApptsRaw = await db
    .select()
    .from(appointments)
    .leftJoin(clients, eq(appointments.clientId, clients.id))
    .leftJoin(pets, eq(appointments.petId, pets.id))
    .leftJoin(services, eq(appointments.serviceId, services.id))
    .leftJoin(staff, eq(appointments.staffId, staff.id))
    .where(
      and(
        eq(appointments.businessId, businessId),
        eq(appointments.date, today),
        ne(appointments.status, 'cancelled'),
      ),
    )
    .orderBy(appointments.startTime)
    .limit(10);

  const todayList = todayApptsRaw.map((r) => ({
    id: r.appointments.id,
    start_time: r.appointments.startTime,
    status: r.appointments.status,
    van: r.appointments.van,
    price: r.appointments.price != null ? Number(r.appointments.price) : null,
    clients: r.clients ? { first_name: r.clients.firstName, last_name: r.clients.lastName } : null,
    pets: r.pets ? { name: r.pets.name } : null,
    services: r.services ? { name: r.services.name } : null,
    staff: r.staff ? { first_name: r.staff.firstName } : null,
  }));

  const monthApptsRaw = await db
    .select()
    .from(appointments)
    .leftJoin(staff, eq(appointments.staffId, staff.id))
    .where(
      and(
        eq(appointments.businessId, businessId),
        gte(appointments.date, firstDay),
        lte(appointments.date, lastDay),
        eq(appointments.status, 'completed')
      )
    );

  const monthAppts = monthApptsRaw.map((r) => ({
    date: r.appointments.date,
    price: r.appointments.price != null ? Number(r.appointments.price) : 0,
    staff: r.staff ? { commission_rate: r.staff.commissionRate != null ? Number(r.staff.commissionRate) : 0 } : null,
  }));

  const prevMonthApptsRaw = await db
    .select({ price: appointments.price })
    .from(appointments)
    .where(
      and(
        eq(appointments.businessId, businessId),
        gte(appointments.date, prevFirst),
        lte(appointments.date, prevLast),
        eq(appointments.status, 'completed')
      )
    );
  const prevMonthAppts = prevMonthApptsRaw.map((r) => ({
    price: r.price != null ? Number(r.price) : 0,
  }));

  const monthExpensesRaw = await db
    .select({ amount: expenses.amount })
    .from(expenses)
    .where(
      and(
        eq(expenses.businessId, businessId),
        gte(expenses.date, firstDay),
        lte(expenses.date, lastDay),
      ),
    );
  const monthExpenses = monthExpensesRaw.map((r) => ({
    amount: r.amount != null ? Number(r.amount) : 0,
  }));

  const allCompletedApptsRaw = await db
    .select({ city: appointments.city, address: appointments.address, price: appointments.price })
    .from(appointments)
    .where(
      and(
        eq(appointments.businessId, businessId),
        eq(appointments.status, 'completed'),
      ),
    )
    .limit(500);
  const allCompletedAppts = allCompletedApptsRaw.map((r) => ({
    city: r.city,
    address: r.address,
    price: r.price != null ? Number(r.price) : null,
  }));

  return {
    clientCount,
    petCount,
    serviceCount,
    appointmentsTodayCount,
    staffCount,
    waitListCount,
    upcomingAppts,
    overdueVaccines,
    todayAppts: todayList,
    monthAppts,
    prevMonthAppts,
    monthExpenses,
    allCompletedAppts,
  };
}

export async function getReportsData(from: string, to: string) {
  const { businessId } = await requireBusiness();
  const apptsRaw = await db
    .select()
    .from(appointments)
    .leftJoin(clients, eq(appointments.clientId, clients.id))
    .leftJoin(pets, eq(appointments.petId, pets.id))
    .leftJoin(services, eq(appointments.serviceId, services.id))
    .leftJoin(staff, eq(appointments.staffId, staff.id))
    .where(
      and(
        eq(appointments.businessId, businessId),
        gte(appointments.date, from),
        lte(appointments.date, to),
      ),
    )
    .orderBy(appointments.date);

  const appointmentsOut = apptsRaw.map((r) => ({
    id: r.appointments.id,
    date: r.appointments.date,
    start_time: r.appointments.startTime,
    price: r.appointments.price != null ? Number(r.appointments.price) : null,
    status: r.appointments.status,
    payment_status: r.appointments.paymentStatus,
    van: r.appointments.van,
    clients: r.clients
      ? { first_name: r.clients.firstName, last_name: r.clients.lastName }
      : null,
    pets: r.pets ? { name: r.pets.name } : null,
    services: r.services ? { name: r.services.name } : null,
    staff: r.staff
      ? {
          id: r.staff.id,
          first_name: r.staff.firstName,
          last_name: r.staff.lastName,
          commission_rate: r.staff.commissionRate != null ? Number(r.staff.commissionRate) : 0,
          color: r.staff.color,
        }
      : null,
  }));

  const expensesRaw = await db
    .select()
    .from(expenses)
    .where(
      and(
        eq(expenses.businessId, businessId),
        gte(expenses.date, from),
        lte(expenses.date, to),
      ),
    );
  const expensesOut = expensesRaw.map((e) => ({
    id: e.id,
    category: e.category ?? 'other',
    amount: Number(e.amount),
    date: e.date,
    description: e.description,
    van: e.van,
  }));

  return { appointments: appointmentsOut, expenses: expensesOut };
}
