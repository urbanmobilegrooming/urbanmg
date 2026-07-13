import { notFound } from 'next/navigation';
import { getCheckinAppointment } from '@/server/public';
import { CheckinView } from '@/components/checkin/CheckinView';

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  return { title: 'Check In | urbanMG' };
}

export default async function CheckinPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const apt = await getCheckinAppointment(id);
  if (!apt) notFound();
  return <CheckinView appointment={apt} />;
}
