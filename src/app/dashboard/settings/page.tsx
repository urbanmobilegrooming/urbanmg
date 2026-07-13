import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth-server";
import { getCurrentProfile } from "@/server/users";
import { SettingsForm } from "@/components/settings/SettingsForm";

export default async function SettingsPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  const current = await getCurrentProfile();
  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
      <SettingsForm
        profile={current?.profile ?? { full_name: "", email: session.user.email ?? "", phone: "" }}
        business={current?.business ?? null}
      />
    </div>
  );
}
