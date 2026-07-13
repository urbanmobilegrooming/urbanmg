import { redirect } from "next/navigation";
import { UsersManager } from "@/components/users/UsersManager";
import { getSession } from "@/lib/auth-server";
import { getCurrentProfile, listProfiles } from "@/server/users";

export default async function UsersPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const current = await getCurrentProfile();
  if (current?.profile.role !== "admin") redirect("/dashboard");

  const profiles = await listProfiles();

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
        <p className="text-sm text-gray-500">Manage users, roles, and permissions</p>
      </div>
      <UsersManager profiles={profiles} />
    </div>
  );
}
