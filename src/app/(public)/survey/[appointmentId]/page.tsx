import { notFound } from 'next/navigation';
import { getSurveyAppointment } from '@/server/public';
import { SurveyView } from '@/components/survey/SurveyView';

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  return { title: 'How did we do? | urbanMG' };
}

export default async function SurveyPage({
  params,
}: {
  params: Promise<{ appointmentId: string }>;
}) {
  const { appointmentId } = await params;
  const apt = await getSurveyAppointment(appointmentId);
  if (!apt) notFound();
  return <SurveyView appointment={apt} />;
}
