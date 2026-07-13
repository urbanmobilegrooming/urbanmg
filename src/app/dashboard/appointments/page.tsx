import { AppointmentsList } from "@/components/appointments/AppointmentsList";
import { listAppointments } from "@/server/appointments";
import { listClients } from "@/server/clients";
import { listActiveServices } from "@/server/services";
import { listStaff } from "@/server/staff";

export const metadata = { title: "Appointments" };

export default async function AppointmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ client?: string; pet?: string }>;
}) {
  const { client, pet } = await searchParams;
  const [appointments, clients, services, staff] = await Promise.all([
    listAppointments(100),
    listClients(),
    listActiveServices(),
    listStaff(),
  ]);

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Appointments</h1>
        <p className="text-sm text-gray-500">Schedule and manage grooming appointments</p>
      </div>
      <AppointmentsList
        appointments={appointments}
        clients={clients}
        services={services}
        staff={staff}
        initialClientId={client ?? null}
        initialPetId={pet ?? null}
      />
    </div>
  );
}
