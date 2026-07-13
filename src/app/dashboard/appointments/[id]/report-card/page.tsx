import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { getReportCardForAppointment } from '@/server/report_cards';
import { ReportCardForm } from '@/components/report-card/ReportCardForm';

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  return { title: 'Report Card | urbanMG' };
}

export default async function ReportCardFormPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getReportCardForAppointment(id);
  if (!data) notFound();

  return (
    <div className="space-y-6 p-6">
      <div>
        <Link
          href="/dashboard/appointments"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900"
        >
          <ArrowLeft size={16} />
          Back to appointments
        </Link>
      </div>
      <ReportCardForm appointmentId={id} initial={data} />
    </div>
  );
}
