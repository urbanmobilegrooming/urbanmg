import { notFound } from 'next/navigation';
import { getAgreement } from '@/server/public';
import { SignView } from '@/components/sign/SignView';

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  return { title: 'Sign Agreement | urbanMG' };
}

export default async function SignPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const agreement = await getAgreement(id);
  if (!agreement) notFound();
  return <SignView agreement={agreement} />;
}
