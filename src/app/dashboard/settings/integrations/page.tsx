import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth-server";
import { getIntegrations } from "@/lib/integrations";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, CheckCircle2, CircleDashed } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function IntegrationsPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  const integrations = getIntegrations();
  const active = integrations.filter((i) => i.configured).length;

  return (
    <div className="space-y-6 p-6">
      <div>
        <Link href="/dashboard/settings" className="mb-2 inline-flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600">
          <ArrowLeft className="h-3.5 w-3.5" /> Settings
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Integrations</h1>
        <p className="text-sm text-gray-500">
          {active} of {integrations.length} connected — each one activates automatically when its keys are added to the server environment
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {integrations.map((i) => (
          <Card key={i.key}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold text-gray-900">{i.name}</span>
                    {i.configured ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-bold text-green-700">
                        <CheckCircle2 className="h-3 w-3" /> Connected
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-bold text-gray-500">
                        <CircleDashed className="h-3 w-3" /> Not configured
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-gray-500">{i.purpose}</p>
                  {!i.configured && (
                    <p className="mt-2 text-[11px] text-gray-400">
                      Needs: {i.requiredEnv.map((e) => (
                        <code key={e} className="mr-1 rounded bg-gray-100 px-1 py-0.5">{e}</code>
                      ))}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <p className="text-xs text-gray-400">
        Setup instructions for each service live in <code className="rounded bg-gray-100 px-1 py-0.5">INTEGRATIONS.md</code> in the repository.
      </p>
    </div>
  );
}
