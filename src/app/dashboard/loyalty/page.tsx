import { LoyaltyClient } from "@/components/loyalty/LoyaltyClient";
import { getLoyaltySettings, listLoyaltyClients, listReferrals } from "@/server/loyalty";

export const metadata = { title: "Loyalty" };

export default async function LoyaltyPage() {
  const [clients, referrals, settings] = await Promise.all([listLoyaltyClients(), listReferrals(), getLoyaltySettings()]);
  return (
    <div className="p-6">
      <LoyaltyClient clients={clients} referrals={referrals} settings={settings} />
    </div>
  );
}
