import { DiscountsManager } from "@/components/discounts/DiscountsManager";
import { listDiscountCodes } from "@/server/discounts";

export const metadata = { title: "Discounts" };

export default async function DiscountsPage() {
  const codes = await listDiscountCodes();
  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Discount Codes</h1>
        <p className="text-sm text-gray-500">Manage promotional codes and discounts</p>
      </div>
      <DiscountsManager codes={codes} />
    </div>
  );
}
