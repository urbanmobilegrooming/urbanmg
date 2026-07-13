import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { MobileNav } from "@/components/layout/MobileNav";
import { MobileHeader } from "@/components/layout/MobileHeader";
import { type Role } from "@/lib/roles";
import { getSession } from "@/lib/auth-server";
import { getCurrentProfile } from "@/server/users";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const current = await getCurrentProfile();
  const role: Role = (current?.profile.role as Role) ?? "staff";

  return (
    <div className="flex h-full">
      <div className="hidden lg:flex lg:h-full lg:w-[220px] lg:flex-shrink-0">
        <Sidebar role={role} />
      </div>

      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="hidden lg:block">
          <Topbar />
        </div>

        <MobileHeader />

        <main className="flex-1 overflow-y-auto bg-[#f1f5f9] pb-20 font-[family-name:var(--font-inter)] lg:pb-0">
          {children}
        </main>

        <MobileNav role={role} />
      </div>
    </div>
  );
}
