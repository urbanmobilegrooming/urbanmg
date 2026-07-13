import { ChatClient } from "@/components/chat/ChatClient";
import { listChatMessages } from "@/server/chat";
import { getSession } from "@/lib/auth-server";

export default async function ChatPage() {
  const session = await getSession();
  const messages = await listChatMessages();
  return (
    <ChatClient
      initialMessages={messages}
      userId={session?.user?.id ?? null}
      userName={session?.user?.name ?? "You"}
    />
  );
}
