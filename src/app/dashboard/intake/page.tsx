import { listIntakeSubmissions, listLeads } from "@/server/intake";
import { IntakeManager } from "@/components/intake/IntakeManager";

export const dynamic = "force-dynamic";

export const metadata = { title: "Intake & Leads" };

export default async function IntakeDashboardPage() {
  const [submissions, leads] = await Promise.all([listIntakeSubmissions(), listLeads()]);

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Intake & Leads</h1>
        <p className="text-sm text-gray-500">
          New client submissions from the public form, and every lead in one place
        </p>
      </div>
      <IntakeManager
        submissions={JSON.parse(JSON.stringify(submissions))}
        leads={JSON.parse(JSON.stringify(leads))}
      />
    </div>
  );
}
