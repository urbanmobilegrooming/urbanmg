"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { Hash, Truck, Megaphone, Send, Pin, Trash2, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { deleteChatMessage, sendChatMessage, togglePinChatMessage, type ChatMessageRow } from "@/server/chat";

const CHANNELS = [
  { id: "general", label: "General", icon: Hash, color: "text-[#2C0F73]" },
  { id: "van5", label: "Van 5", icon: Truck, color: "text-blue-500" },
  { id: "van7", label: "Van 7", icon: Truck, color: "text-green-500" },
  { id: "announcements", label: "Announcements", icon: Megaphone, color: "text-[#f2c037]" },
];

function avatarBg(name: string) {
  const colors = ["#2C0F73", "#7c3aed", "#2563eb", "#059669", "#d97706", "#dc2626", "#0891b2"];
  let h = 0; for (const ch of name ?? "") h = h * 31 + ch.charCodeAt(0);
  return colors[Math.abs(h) % colors.length];
}

function initials(name: string) {
  const parts = (name ?? "").split(" ");
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase();
}

export function ChatClient({ initialMessages, userId, userName }: { initialMessages: ChatMessageRow[]; userId: string | null; userName: string }) {
  const [messages, setMessages] = useState(initialMessages);
  const [active, setActive] = useState("general");
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const channelMessages = useMemo(() => messages.filter((m) => m.channel === active), [messages, active]);
  const pinned = channelMessages.filter((m) => m.is_pinned);
  const activeCh = CHANNELS.find((c) => c.id === active)!;
  const ActiveIcon = activeCh.icon;

  useEffect(() => {
    containerRef.current?.scrollTo({ top: containerRef.current.scrollHeight });
  }, [channelMessages.length]);

  async function send() {
    if (!text.trim() || sending) return;
    setSending(true);
    try {
      await sendChatMessage({ channel: active, message: text.trim() });
      const newMsg: ChatMessageRow = { id: crypto.randomUUID(), channel: active, sender_id: userId, sender_name: userName, message: text.trim(), is_pinned: false, created_at: new Date().toISOString() };
      setMessages((m) => [...m, newMsg]);
      setText("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setSending(false);
    }
  }

  async function pin(msg: ChatMessageRow) {
    try {
      await togglePinChatMessage(msg.id, msg.is_pinned);
      setMessages((arr) => arr.map((m) => (m.id === msg.id ? { ...m, is_pinned: !m.is_pinned } : m)));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  }

  async function del(msg: ChatMessageRow) {
    if (!confirm("Delete this message?")) return;
    try {
      await deleteChatMessage(msg.id);
      setMessages((arr) => arr.filter((m) => m.id !== msg.id));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  }

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden">
      <div className="flex w-64 shrink-0 flex-col border-r border-gray-100 bg-white">
        <div className="border-b border-gray-100 px-5 py-4">
          <h1 className="text-lg font-black text-gray-900">Staff Chat</h1>
          <p className="text-xs text-gray-400">Internal team messaging</p>
        </div>
        <nav className="flex-1 overflow-y-auto py-3">
          <div className="mb-1 px-4 text-[9px] font-extrabold uppercase tracking-widest text-gray-300">Channels</div>
          {CHANNELS.map((ch) => {
            const Icon = ch.icon;
            return (
              <button key={ch.id} onClick={() => setActive(ch.id)} className={`mx-2 flex w-[calc(100%-16px)] items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all ${active === ch.id ? "bg-[#2C0F73]/8 text-[#2C0F73]" : "text-gray-500 hover:bg-gray-50"}`}>
                <Icon className={`h-4 w-4 ${active === ch.id ? ch.color : ""}`} />
                <span className="flex-1 text-sm font-semibold">{ch.label}</span>
              </button>
            );
          })}
        </nav>
        <div className="border-t border-gray-100 px-4 py-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#2C0F73]/10 text-xs font-black text-[#2C0F73]">{initials(userName)}</div>
            <div>
              <div className="truncate text-xs font-bold text-gray-800">{userName}</div>
              <div className="flex items-center gap-1 text-[10px] text-green-500">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-green-400" /> Online
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col overflow-hidden bg-gray-50">
        <div className="flex items-center justify-between border-b border-gray-100 bg-white px-6 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#2C0F73]/8">
              <ActiveIcon className={`h-4 w-4 ${activeCh.color}`} />
            </div>
            <div>
              <div className="font-bold text-gray-900">{activeCh.label}</div>
              <div className="text-xs text-gray-400">{channelMessages.length} messages · {pinned.length} pinned</div>
            </div>
          </div>
        </div>

        <div ref={containerRef} className="flex-1 overflow-y-auto px-6 py-4 space-y-1">
          {channelMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <MessageCircle className="h-8 w-8 text-[#2C0F73]/40 mb-2" />
              <p className="text-sm font-semibold text-gray-400">No messages yet</p>
            </div>
          ) : (
            channelMessages.map((msg) => (
              <div key={msg.id} className={`group flex items-start gap-3 rounded-xl px-3 py-2 hover:bg-white ${msg.is_pinned ? "border border-[#f2c037]/20 bg-[#f2c037]/5" : ""}`}>
                <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-full text-xs font-black text-white" style={{ background: avatarBg(msg.sender_name) }}>
                  {initials(msg.sender_name)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-bold text-gray-900">{msg.sender_name}</span>
                    <span className="text-[11px] text-gray-400">{new Date(msg.created_at).toLocaleTimeString()}</span>
                    {msg.is_pinned && <span className="rounded-full bg-[#f2c037]/20 px-1.5 py-0.5 text-[9px] font-bold text-[#b8860b]"><Pin className="inline h-2.5 w-2.5 mr-0.5" />Pinned</span>}
                  </div>
                  <p className="mt-0.5 text-sm leading-relaxed text-gray-700">{msg.message}</p>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
                  <button onClick={() => pin(msg)} className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:text-[#b8860b]"><Pin className="h-3 w-3" /></button>
                  <button onClick={() => del(msg)} className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:text-red-500"><Trash2 className="h-3 w-3" /></button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="border-t border-gray-100 bg-white px-6 py-4">
          <form onSubmit={(e) => { e.preventDefault(); send(); }} className="flex items-end gap-3">
            <Input value={text} onChange={(e) => setText(e.target.value)} placeholder={`Message #${activeCh.label}`} disabled={sending} className="flex-1" />
            <Button type="submit" disabled={!text.trim() || sending} className="bg-[#2C0F73] hover:bg-[#3d1a99]">
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
