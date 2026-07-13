import { ClientsTable } from "@/components/clients/ClientsTable";
import { listClients } from "@/server/clients";

export default async function ClientsPage() {
  const clients = await listClients();

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-[family-name:var(--font-inter)] text-2xl font-bold text-gray-900">
          Clients
        </h1>
      </div>
      <ClientsTable clients={clients} />
    </div>
  );
}
