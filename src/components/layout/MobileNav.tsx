"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Calendar, Users, PawPrint, Scissors,
  Menu, X, UserCircle, DollarSign, Truck, BarChart3,
  Settings, Shield, ClockAlert, MessageSquare, FileText,
  Package, UserPlus, RotateCcw,
  Images, Boxes, Wrench, Bell, MessagesSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { type Role, roleAccess } from "@/lib/roles";
import { useState } from "react";

// Bottom tab bar items (max 5 for mobile)
const tabItems = [
  { label: "Home", href: "/dashboard", icon: LayoutDashboard },
  { label: "Appts", href: "/dashboard/appointments", icon: Calendar },
  { label: "Clients", href: "/dashboard/clients", icon: Users },
  { label: "Pets", href: "/dashboard/pets", icon: PawPrint },
  { label: "More", href: "#more", icon: Menu },
];

// Full menu items for the "More" drawer
const allNavItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Clients", href: "/dashboard/clients", icon: Users },
  { label: "Intake & Leads", href: "/dashboard/intake", icon: UserPlus },
  { label: "Pets", href: "/dashboard/pets", icon: PawPrint },
  { label: "Services", href: "/dashboard/services", icon: Scissors },
  { label: "Appointments", href: "/dashboard/appointments", icon: Calendar },
  { label: "Staff", href: "/dashboard/staff", icon: UserCircle },
  { label: "Wait List", href: "/dashboard/waitlist", icon: ClockAlert },
  { label: "Rebooking", href: "/dashboard/rebooking", icon: RotateCcw },
  { label: "Billing", href: "/dashboard/billing", icon: DollarSign },
  { label: "Routes", href: "/dashboard/routes", icon: Truck },
  { label: "Payroll", href: "/dashboard/payroll", icon: DollarSign },
  { label: "Reports", href: "/dashboard/reports", icon: BarChart3 },
  { label: "Messages", href: "/dashboard/messages", icon: MessageSquare },
  { label: "Team Chat", href: "/dashboard/chat", icon: MessagesSquare },
  { label: "Gallery", href: "/dashboard/gallery", icon: Images },
  { label: "Inventory", href: "/dashboard/inventory", icon: Boxes },
  { label: "Van Maintenance", href: "/dashboard/van-maintenance", icon: Wrench },
  { label: "Alerts", href: "/dashboard/notifications", icon: Bell },
  { label: "Agreements", href: "/dashboard/agreements", icon: FileText },
  { label: "Products", href: "/dashboard/products", icon: Package },
  { label: "Discounts", href: "/dashboard/discounts", icon: DollarSign },
  { label: "Users", href: "/dashboard/users", icon: Shield },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
];

export function MobileNav({ role = "admin" }: { role?: Role }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const allowed = roleAccess[role] ?? roleAccess.staff;

  const filteredNav = allNavItems.filter((item) =>
    allowed.some((p) => item.href === p || item.href.startsWith(p + "/"))
  );

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  }

  return (
    <>
      {/* Bottom Tab Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around border-t border-gray-200 bg-white pb-[env(safe-area-inset-bottom)] lg:hidden">
        {tabItems.map((item) => {
          if (item.href === "#more") {
            return (
              <button
                key="more"
                onClick={() => setMenuOpen(true)}
                className="flex flex-1 flex-col items-center gap-0.5 py-2 text-gray-400"
              >
                <Menu size={20} />
                <span className="text-[10px] font-medium">More</span>
              </button>
            );
          }
          const active = isActive(item.href);
          if (!allowed.some((p) => item.href === p || item.href.startsWith(p + "/"))) return null;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-1 flex-col items-center gap-0.5 py-2 transition-colors",
                active ? "text-[#f2c037]" : "text-gray-400"
              )}
            >
              <item.icon size={20} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Full Menu Drawer */}
      {menuOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50" onClick={() => setMenuOpen(false)} />

          {/* Drawer */}
          <div className="absolute bottom-0 left-0 right-0 max-h-[85vh] overflow-y-auto rounded-t-3xl bg-white pb-[env(safe-area-inset-bottom)] animate-[slideUp_0.3s_ease-out]">
            {/* Handle */}
            <div className="sticky top-0 z-10 flex items-center justify-between bg-white px-5 pb-2 pt-4">
              <span className="text-lg font-bold text-gray-900">Menu</span>
              <button onClick={() => setMenuOpen(false)} className="rounded-full bg-gray-100 p-2">
                <X size={18} className="text-gray-500" />
              </button>
            </div>

            {/* Menu items */}
            <div className="grid grid-cols-3 gap-2 px-4 pb-6">
              {filteredNav.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMenuOpen(false)}
                    className={cn(
                      "flex flex-col items-center gap-1.5 rounded-2xl p-4 transition-all",
                      active
                        ? "bg-[#f2c037]/10 text-[#f2c037]"
                        : "bg-gray-50 text-gray-500 hover:bg-gray-100"
                    )}
                  >
                    <item.icon size={22} />
                    <span className="text-[11px] font-semibold">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
