import { VanMaintenanceClient } from "@/components/van-maintenance/VanMaintenanceClient";
import { listFuelLogs, listVanMaintenance, listVans } from "@/server/vans";

export const metadata = { title: "Van Maintenance" };

export default async function VanMaintenancePage() {
  const [vans, maint, fuel] = await Promise.all([listVans(), listVanMaintenance(), listFuelLogs()]);
  return (
    <div className="p-6">
      <VanMaintenanceClient vans={vans} maintenance={maint} fuel={fuel} />
    </div>
  );
}
