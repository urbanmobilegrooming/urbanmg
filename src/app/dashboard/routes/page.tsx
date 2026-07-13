import { RoutesPageWrapper } from "@/components/routes/RoutesPageWrapper";
import { listAppointmentsForDate } from "@/server/appointments";
import { listStaff } from "@/server/staff";
import { listVans } from "@/server/vans";

export default async function RoutesPage() {
  const today = new Date().toISOString().split("T")[0];
  const [appointments, staff, vans] = await Promise.all([
    listAppointmentsForDate(today),
    listStaff(),
    listVans(),
  ]);

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Routes</h1>
        <p className="text-sm text-gray-500">Today&apos;s schedule by van</p>
      </div>
      <RoutesPageWrapper
        appointments={appointments}
        staff={staff}
        vans={vans}
        today={today}
      />
    </div>
  );
}
