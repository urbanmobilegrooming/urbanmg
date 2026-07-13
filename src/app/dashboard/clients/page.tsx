import { ClientsTable } from "@/components/clients/ClientsTable";
import { listClients } from "@/server/clients";

export const metadata = { title: "Clients" };

export default async function ClientsPage() {
  const clients = await listClients();

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="font-[family-name:var(--font-inter)] text-2xl font-bold text-gray-900">
          Clients
        </h1>
      </div>
      <ClientsTable clients={clients} />
    </div>
  );
}
