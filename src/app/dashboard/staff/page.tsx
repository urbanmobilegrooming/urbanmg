import { StaffList } from "@/components/staff/StaffList";
import { listStaff } from "@/server/staff";

export const metadata = { title: "Staff" };

export default async function StaffPage() {
  const staff = await listStaff();
  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Staff & Groomers</h1>
        <p className="text-sm text-gray-500">Manage your team and commissions</p>
      </div>
      <StaffList staff={staff} />
    </div>
  );
}
