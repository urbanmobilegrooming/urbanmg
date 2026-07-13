import { AgreementsManager } from "@/components/agreements/AgreementsManager";
import { listAgreementTemplates, listClientAgreements } from "@/server/messaging";
import { listClients } from "@/server/clients";

export const metadata = { title: "Agreements" };

export default async function AgreementsPage() {
  const [templates, agreements, clients] = await Promise.all([
    listAgreementTemplates(),
    listClientAgreements(50),
    listClients(),
  ]);

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Agreements</h1>
        <p className="text-sm text-gray-500">Service agreements and digital signatures</p>
      </div>
      <AgreementsManager templates={templates} agreements={agreements} clients={clients} />
    </div>
  );
}
