import { WaitListManager } from "@/components/waitlist/WaitListManager";
import { listClients } from "@/server/clients";
import { listActiveServices } from "@/server/services";
import { listStaff } from "@/server/staff";
import { listWaitList } from "@/server/wait_list";

export const metadata = { title: "Wait List" };

export default async function WaitListPage() {
  const [entries, clients, services, staff] = await Promise.all([
    listWaitList(),
    listClients(),
    listActiveServices(),
    listStaff(),
  ]);

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Wait List</h1>
        <p className="text-sm text-gray-500">Clients waiting for available slots</p>
      </div>
      <WaitListManager
        entries={entries}
        clients={clients}
        services={services}
        staff={staff}
      />
    </div>
  );
}
