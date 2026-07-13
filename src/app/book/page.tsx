import { BookingLanding } from "@/components/booking/BookingLanding";
import { db } from "@/lib/db";
import { serviceCategories, services, staff } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";

export const metadata = {
  title: "Book Now | Urban Mobile Grooming - Miami Mobile Pet Grooming",
  description:
    "Book professional mobile pet grooming in Miami-Dade & Broward County. Bath, Full Grooming, Dental Prophylaxis. We come to you!",
  openGraph: {
    title: "Book Now | Urban Mobile Grooming",
    description: "Professional mobile pet grooming in Miami. We come to you!",
    images: ["/booking/og-banner.jpg"],
  },
};

export default async function BookingPage() {
  const [catRows, svcRows, staffRows] = await Promise.all([
    db.select().from(serviceCategories).orderBy(serviceCategories.name),
    db.select().from(services).where(eq(services.isActive, true)).orderBy(services.name),
    db.select().from(staff).where(and(eq(staff.isActive, true), eq(staff.role, "groomer"))),
  ]);

  const categories = catRows.map((c) => ({ id: c.id, name: c.name }));
  const svcOut = svcRows.map((s) => ({
    id: s.id,
    name: s.name,
    category_id: s.categoryId ?? "",
    duration_minutes: s.durationMinutes,
    base_price: s.basePrice != null ? Number(s.basePrice) : 0,
  }));
  const staffOut = staffRows.map((s) => ({
    id: s.id,
    first_name: s.firstName,
    last_name: s.lastName,
    color: s.color,
  }));

  return (
    <BookingLanding
      categories={categories}
      services={svcOut}
      staff={staffOut}
    />
  );
}
