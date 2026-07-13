import { notFound } from 'next/navigation';
import { getTrackingAppointment } from '@/server/public';
import { TrackingView } from '@/components/tracking/TrackingView';

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  return { title: 'Live Tracking | urbanMG' };
}

export default async function TrackingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const apt = await getTrackingAppointment(id);
  if (!apt) notFound();
  return <TrackingView initialAppointment={apt} />;
}
