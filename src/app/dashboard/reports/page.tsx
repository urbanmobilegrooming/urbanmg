import { ReportsDashboard } from "@/components/reports/ReportsDashboard";

export default function ReportsPage() {
  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        <p className="text-sm text-gray-500">Revenue and performance analytics</p>
      </div>
      <ReportsDashboard />
    </div>
  );
}
