import { listRebookingOpportunities } from "@/server/rebooking";
import { RebookingClient } from "@/components/rebooking/RebookingClient";

export const dynamic = "force-dynamic";

export default async function RebookingPage() {
  const opportunities = await listRebookingOpportunities();

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Rebooking</h1>
        <p className="text-sm text-gray-500">
          Pets that are due for their next groom — recover revenue before they slip away
        </p>
      </div>
      <RebookingClient opportunities={opportunities} />
    </div>
  );
}
