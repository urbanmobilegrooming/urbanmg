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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <a
          href="/dashboard/settings/integrations"
          className="rounded-xl border border-[#f2c037] px-4 py-2 text-sm font-bold text-[#b8901f] hover:bg-[#f2c037]/10"
        >
          Integrations →
        </a>
      </div>
      <SettingsForm
        profile={current?.profile ?? { full_name: "", email: session.user.email ?? "", phone: "" }}
        business={current?.business ?? null}
      />
    </div>
  );
}
