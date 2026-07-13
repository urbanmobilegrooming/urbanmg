import { MarketingClient } from "@/components/marketing/MarketingClient";
import { listBirthdayPets, listRebookClients, listCampaigns } from "@/server/marketing";

export const metadata = { title: "Marketing" };

export default async function MarketingPage() {
  const [birthdays, rebook, campaigns] = await Promise.all([listBirthdayPets(), listRebookClients(), listCampaigns()]);
  return (
    <div className="p-6">
      <MarketingClient birthdays={birthdays} rebook={rebook} campaigns={campaigns} />
    </div>
  );
}
