"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, CalendarCheck, UserPlus, CheckCheck, CircleDot } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  getNotificationsFeed,
  markAllNotificationsRead,
  markNotificationRead,
  type NotificationRow,
} from "@/server/notifications_feed";

function typeIcon(type: string) {
  if (type === "intake") return <UserPlus className="h-4 w-4 text-blue-500" />;
  if (type === "booking") return <CalendarCheck className="h-4 w-4 text-green-500" />;
  if (type === "completed") return <CheckCheck className="h-4 w-4 text-purple-500" />;
  return <CircleDot className="h-4 w-4 text-gray-400" />;
}

function timeAgo(iso: string) {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

export function NotificationBell() {
  const router = useRouter();
  const [items, setItems] = useState<NotificationRow[]>([]);
  const [unread, setUnread] = useState(0);

  const refresh = useCallback(async () => {
    try {
      const feed = await getNotificationsFeed();
      setItems(feed.items);
      setUnread(feed.unread);
    } catch {
      /* not logged in yet */
    }
  }, []);

  useEffect(() => {
    refresh();
    const itv = setInterval(refresh, 30000);
    return () => clearInterval(itv);
  }, [refresh]);

  async function open(n: NotificationRow) {
    if (!n.is_read) {
      markNotificationRead(n.id).catch(() => {});
      setUnread((u) => Math.max(0, u - 1));
      setItems((list) => list.map((x) => (x.id === n.id ? { ...x, is_read: true } : x)));
    }
    if (n.href) router.push(n.href);
  }

  async function readAll() {
    await markAllNotificationsRead().catch(() => {});
    setItems((list) => list.map((x) => ({ ...x, is_read: true })));
    setUnread(0);
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="relative flex h-9 w-9 items-center justify-center rounded-lg transition-colors hover:bg-[#e6b535] outline-none">
        <Bell className="h-5 w-5 text-[#2C0F73]" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-black text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b px-4 py-2.5">
          <span className="text-sm font-bold text-gray-900">Notifications</span>
          {unread > 0 && (
            <button onClick={readAll} className="text-[11px] font-semibold text-blue-600 hover:underline">
              Mark all read
            </button>
          )}
        </div>
        <div className="max-h-96 overflow-y-auto">
          {items.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-gray-400">No notifications yet</div>
          ) : (
            items.map((n) => (
              <button
                key={n.id}
                onClick={() => open(n)}
                className={`flex w-full items-start gap-3 border-b px-4 py-3 text-left last:border-0 hover:bg-gray-50 ${!n.is_read ? "bg-blue-50/50" : ""}`}
              >
                <div className="mt-0.5 shrink-0">{typeIcon(n.type)}</div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className={`truncate text-[13px] ${!n.is_read ? "font-bold text-gray-900" : "font-medium text-gray-600"}`}>{n.title}</span>
                    <span className="shrink-0 text-[10px] text-gray-400">{timeAgo(n.created_at)}</span>
                  </div>
                  {n.body && <p className="truncate text-xs text-gray-500">{n.body}</p>}
                </div>
                {!n.is_read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-blue-500" />}
              </button>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
