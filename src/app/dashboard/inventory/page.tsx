import { InventoryClient } from "@/components/inventory/InventoryClient";
import { listInventoryItems, listVansSimple } from "@/server/inventory";

export const metadata = { title: "Inventory" };

export default async function InventoryPage() {
  const [items, vans] = await Promise.all([listInventoryItems(), listVansSimple()]);
  return (
    <div className="p-6">
      <InventoryClient items={items} vans={vans} />
    </div>
  );
}
