import { ActivityClient } from "@/components/activity/ActivityClient";
import { listActivity } from "@/server/activity";

export default async function ActivityPage() {
  const entries = await listActivity({});
  return (
    <div className="p-6">
      <ActivityClient initial={entries} />
    </div>
  );
}
