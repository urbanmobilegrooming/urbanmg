import { GroomerAppClient } from "@/components/groomer-app/GroomerAppClient";
import { listMyAppointments } from "@/server/groomer";
import { getSession } from "@/lib/auth-server";

export default async function GroomerAppPage() {
  const session = await getSession();
  const appointments = await listMyAppointments(session?.user?.id);
  return <GroomerAppClient appointments={appointments} userName={session?.user?.name ?? "Groomer"} />;
}
