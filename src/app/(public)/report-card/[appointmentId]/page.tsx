import { notFound } from 'next/navigation';
import { getPublicReportCard } from '@/server/public';
import { ReportCardView } from '@/components/report-card/ReportCardView';

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  return { title: 'Report Card | urbanMG' };
}

export default async function ReportCardPage({
  params,
}: {
  params: Promise<{ appointmentId: string }>;
}) {
  const { appointmentId } = await params;
  const data = await getPublicReportCard(appointmentId);
  if (!data) notFound();
  return <ReportCardView data={data} />;
}
