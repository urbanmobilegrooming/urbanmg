import { GroomerAppClient } from "@/components/groomer-app/GroomerAppClient";
import { listMyAppointments } from "@/server/groomer";
import { getSession } from "@/lib/auth-server";
import { getCurrentProfile } from "@/server/users";

export const metadata = { title: "Groomer App" };

export default async function GroomerAppPage() {
  const [session, current] = await Promise.all([getSession(), getCurrentProfile()]);
  // los groomers ven solo sus citas (staff.profile_id); admin/manager ven todas
  const profileId = current?.profile.role === "groomer" ? current.profile.id : null;
  const appointments = await listMyAppointments(profileId);
  return <GroomerAppClient appointments={appointments} userName={session?.user?.name ?? "Groomer"} />;
}
