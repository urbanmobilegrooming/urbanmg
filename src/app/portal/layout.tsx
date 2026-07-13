import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth-server";
import { getCurrentClient } from "@/server/portal";
import { PortalHeader } from "@/components/portal/PortalHeader";

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const client = await getCurrentClient();

  const fullName =
    client?.full_name ||
    client?.user_name ||
    session.user.name ||
    session.user.email ||
    "Customer";
  const email = client?.user_email ?? session.user.email ?? "";

  return (
    <div className="flex min-h-screen flex-col bg-[#fafafa]">
      <PortalHeader fullName={fullName} email={email} />

      <main className="flex-1 pb-24 md:pb-6">
        <div className="mx-auto max-w-5xl px-4 py-6 lg:px-6">
          {!client ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center">
              <p className="text-[14px] font-bold text-amber-700">
                Your account isn&apos;t linked to a client profile yet.
              </p>
              <p className="mt-1 text-[12px] text-amber-600">
                Please contact the office so we can connect your account.
              </p>
            </div>
          ) : (
            children
          )}
        </div>
      </main>
    </div>
  );
}
