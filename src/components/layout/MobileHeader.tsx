"use client";

import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LogOut, User } from "lucide-react";
import { useSession, signOut } from "@/lib/auth-client";

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/dashboard/clients": "Clients",
  "/dashboard/pets": "Pets",
  "/dashboard/services": "Services",
  "/dashboard/appointments": "Appointments",
  "/dashboard/staff": "Staff",
  "/dashboard/waitlist": "Wait List",
  "/dashboard/billing": "Billing",
  "/dashboard/routes": "Routes",
  "/dashboard/payroll": "Payroll",
  "/dashboard/reports": "Reports",
  "/dashboard/messages": "Messages",
  "/dashboard/agreements": "Agreements",
  "/dashboard/products": "Products",
  "/dashboard/discounts": "Discounts",
  "/dashboard/users": "Users",
  "/dashboard/settings": "Settings",
};

export function MobileHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session } = useSession();
  const user = session?.user ?? null;

  async function handleSignOut() {
    await signOut();
    router.push("/login");
    router.refresh();
  }

  const title = pageTitles[pathname] ?? Object.entries(pageTitles).find(([k]) => pathname.startsWith(k))?.[1] ?? "urbanMG";

  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "U";

  return (
    <header className="flex h-14 items-center justify-between border-b border-[#d4a82e] bg-[#f2c037] px-4 lg:hidden">
      <div className="flex items-center gap-3">
        <Image src="/logo-urban.png" alt="urbanMG" width={28} height={28}  />
        <h1 className="text-base font-bold text-[#2C0F73]">{title}</h1>
      </div>
      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger className="outline-none">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-[#2C0F73] text-[10px] font-bold text-white">
                {initials}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem onClick={() => router.push("/dashboard/settings")}>
              <User className="mr-2 h-4 w-4" /> Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleSignOut} className="text-red-600">
              <LogOut className="mr-2 h-4 w-4" /> Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
