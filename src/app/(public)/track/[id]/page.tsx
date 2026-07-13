import { notFound } from 'next/navigation';
import { getTrackingAppointment } from '@/server/public';
import { getTrackingByToken } from '@/server/tracking';
import { TrackingView } from '@/components/tracking/TrackingView';
import { LiveTrackingView } from '@/components/tracking/LiveTrackingView';

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

  // token de sesión de tracking en vivo (GPS real)
  const live = await getTrackingByToken(id);
  if (live) return <LiveTrackingView token={id} initial={live} />;

  // fallback: links viejos con id de cita
  const apt = await getTrackingAppointment(id);
  if (!apt) notFound();
  return <TrackingView initialAppointment={apt} />;
}
