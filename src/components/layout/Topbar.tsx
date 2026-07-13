"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LogOut, User, ChevronLeft } from "lucide-react";
import { useSession, signOut } from "@/lib/auth-client";
import { NotificationBell } from "@/components/layout/NotificationBell";

export function Topbar() {
  const router = useRouter();
  const { data: session } = useSession();
  const user = session?.user ?? null;

  async function handleSignOut() {
    await signOut();
    router.push("/login");
    router.refresh();
  }

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "U";

  return (
    <header className="flex h-14 items-center border-b border-[#d4a82e] bg-[#f2c037] px-4 sm:px-6">
      <div className="flex w-full items-center sm:hidden">
        <button
          onClick={() => router.back()}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-[#2C0F73] transition-colors hover:bg-[#e6b535]"
        >
          <ChevronLeft size={22} />
        </button>

        <div className="flex flex-1 items-center justify-center">
          <Image
            src="/logo-urban.png"
            alt="Urban Mobile Grooming"
            width={160}
            height={40}
            className="h-9 w-auto"
            priority
          />
        </div>

        <NotificationBell />

        <DropdownMenu>
          <DropdownMenuTrigger className="flex h-9 w-9 items-center justify-center rounded-lg transition-colors hover:bg-[#e6b535] outline-none">
            <Avatar className="h-7 w-7">
              <AvatarFallback className="bg-[#2C0F73] text-[10px] font-bold text-white">
                {initials}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => router.push("/dashboard/settings")}>
              <User className="mr-2 h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleSignOut} className="text-red-600">
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="hidden w-full items-center justify-end gap-1 sm:flex">
        <NotificationBell />
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-[#e6b535] outline-none">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-[#2C0F73] text-xs font-bold text-white">
                {initials}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium text-[#2C0F73]">
              {user?.name || "Loading..."}
            </span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => router.push("/dashboard/settings")}>
              <User className="mr-2 h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleSignOut} className="text-red-600">
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
