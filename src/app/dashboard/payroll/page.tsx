import { PayrollView } from "@/components/payroll/PayrollView";
import { listAppointmentsForRange } from "@/server/appointments";
import { listStaff } from "@/server/staff";

export const metadata = { title: "Payroll" };

export default async function PayrollPage() {
  const currentMonth = new Date();
  const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).toISOString().split("T")[0];
  const lastDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).toISOString().split("T")[0];

  const [completedAppointments, staff] = await Promise.all([
    listAppointmentsForRange(firstDay, lastDay, { status: "completed" }),
    listStaff(),
  ]);

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Payroll</h1>
        <p className="text-sm text-gray-500">Commission tracking and pay management</p>
      </div>
      <PayrollView
        appointments={completedAppointments}
        staff={staff}
      />
    </div>
  );
}
