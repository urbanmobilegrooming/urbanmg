import { listMyAppointments } from "@/server/portal";
import { AppointmentsClient } from "@/components/portal/AppointmentsClient";

export default async function PortalAppointmentsPage() {
  const appointments = await listMyAppointments();
  return <AppointmentsClient appointments={appointments} />;
}
