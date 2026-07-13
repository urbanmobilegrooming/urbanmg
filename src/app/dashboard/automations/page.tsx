import { AutomationsClient } from "@/components/automations/AutomationsClient";
import { listMessageTemplates, listMessages } from "@/server/messaging";
import { listReminderSettings } from "@/server/marketing";

export const metadata = { title: "Automations" };

export default async function AutomationsPage() {
  const [templates, messages, reminders] = await Promise.all([
    listMessageTemplates(),
    listMessages(200),
    listReminderSettings(),
  ]);
  return (
    <div className="p-6">
      <AutomationsClient templates={templates} messages={messages} reminders={reminders} />
    </div>
  );
}
