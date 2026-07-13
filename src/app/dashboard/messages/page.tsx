import { MessagingCenter } from "@/components/messages/MessagingCenter";
import { listMessageTemplates, listMessages } from "@/server/messaging";
import { listClients } from "@/server/clients";

export default async function MessagesPage() {
  const [templates, messages, clients] = await Promise.all([
    listMessageTemplates(),
    listMessages(50),
    listClients(),
  ]);

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
        <p className="text-sm text-gray-500">Templates and message history</p>
      </div>
      <MessagingCenter templates={templates} messages={messages} clients={clients} />
    </div>
  );
}
