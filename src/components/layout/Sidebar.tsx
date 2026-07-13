"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Users, PawPrint, Scissors, Calendar,
  DollarSign, Truck, BarChart3, Settings, UserCircle, Shield, ClockAlert,
  MessageSquare, FileText, Package,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { type Role, roleAccess } from "@/lib/roles";

const allNavItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Clients", href: "/dashboard/clients", icon: Users },
  { label: "Pets", href: "/dashboard/pets", icon: PawPrint },
  { label: "Services", href: "/dashboard/services", icon: Scissors },
  { label: "Appointments", href: "/dashboard/appointments", icon: Calendar },
  { label: "Staff", href: "/dashboard/staff", icon: UserCircle },
  { label: "Wait List", href: "/dashboard/waitlist", icon: ClockAlert },
  { label: "Billing", href: "/dashboard/billing", icon: DollarSign },
  { label: "Routes", href: "/dashboard/routes", icon: Truck },
  { label: "Payroll", href: "/dashboard/payroll", icon: DollarSign },
  { label: "Reports", href: "/dashboard/reports", icon: BarChart3 },
  { label: "Messages", href: "/dashboard/messages", icon: MessageSquare },
  { label: "Agreements", href: "/dashboard/agreements", icon: FileText },
  { label: "Products", href: "/dashboard/products", icon: Package },
  { label: "Discounts", href: "/dashboard/discounts", icon: DollarSign },
  { label: "Users", href: "/dashboard/users", icon: Shield },
];

const bottomItems = [
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
];

export function Sidebar({ role = "admin" }: { role?: Role }) {
  const pathname = usePathname();
  const allowed = roleAccess[role] ?? roleAccess.staff;

  const navItems = allNavItems.filter((item) =>
    allowed.some((p) => item.href === p || item.href.startsWith(p + "/"))
  );

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  }

  return (
    <aside className="flex h-full w-[220px] flex-shrink-0 flex-col border-r border-white/[0.07] bg-[#1a0a3e]">
      {/* Logo */}
      <div className="flex items-center justify-center border-b border-white/[0.07] px-4 py-4">
        <Image
          src="/logo-urban.png"
          alt="Urban Mobile Grooming"
          width={160}
          height={44}
          priority
        />
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3">
        <div className="px-4 pb-1 text-[9px] font-extrabold uppercase tracking-widest text-white/20">
          Menu
        </div>
        {navItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "mx-2 my-0.5 flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-all",
                active
                  ? "bg-[#f2c037]/15 text-[#f2c037]"
                  : "text-white/50 hover:bg-white/[0.06] hover:text-white/70"
              )}
            >
              <item.icon size={17} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="border-t border-white/[0.07] py-2">
        {bottomItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "mx-2 flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-all",
                active
                  ? "bg-[#f2c037]/15 text-[#f2c037]"
                  : "text-white/50 hover:bg-white/[0.06] hover:text-white/70"
              )}
            >
              <item.icon size={17} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </aside>
  );
}
