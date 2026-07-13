import { getMyLoyalty } from "@/server/portal";
import { LoyaltyClient } from "@/components/portal/LoyaltyClient";

export default async function PortalLoyaltyPage() {
  const data = await getMyLoyalty();
  return (
    <LoyaltyClient
      points={data.points}
      referralCode={data.referral_code}
      history={data.history}
    />
  );
}
