import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { StaffSchedule } from "@/components/staff/StaffSchedule";
import { StaffClockRecords } from "@/components/staff/StaffClockRecords";
import { getStaff, listBlockTimes, listClockRecords, listSchedules } from "@/server/staff";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const member = await getStaff(id);
  if (!member) return { title: "Staff | urbanMG" };
  return { title: `${member.first_name} ${member.last_name} | urbanMG` };
}

export default async function StaffDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [member, schedules, blockTimes, clockRecords] = await Promise.all([
    getStaff(id),
    listSchedules(id),
    listBlockTimes(id),
    listClockRecords(id, 30),
  ]);
  if (!member) notFound();

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/staff"><Button variant="ghost" size="sm"><ArrowLeft className="mr-1 h-4 w-4" /> Back</Button></Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{member.first_name} {member.last_name}</h1>
          <p className="text-sm capitalize text-gray-500">{member.role} · {member.commission_rate}% commission</p>
        </div>
      </div>

      <StaffSchedule staffId={id} schedules={schedules} blockTimes={blockTimes} />
      <StaffClockRecords staffId={id} records={clockRecords} />
    </div>
  );
}
