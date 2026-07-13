"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { signOut } from "@/lib/auth-client";
import {
  Home,
  Calendar,
  Heart,
  Receipt,
  Gift,
  Search,
  CalendarPlus,
  LogOut,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

type NavItem = {
  label: string;
  mobileLabel: string;
  href: string;
  icon: typeof Home;
  exact?: boolean;
};

const NAV: NavItem[] = [
  { label: "Home", mobileLabel: "Home", href: "/portal", icon: Home, exact: true },
  { label: "Appointments", mobileLabel: "Appts", href: "/portal/appointments", icon: Calendar },
  { label: "My Pets", mobileLabel: "Pets", href: "/portal/pets", icon: Heart },
  { label: "Pet Match", mobileLabel: "Match", href: "/portal/matches", icon: Search },
  { label: "Invoices", mobileLabel: "Invoices", href: "/portal/invoices", icon: Receipt },
  { label: "Rewards", mobileLabel: "Rewards", href: "/portal/loyalty", icon: Gift },
  { label: "Book", mobileLabel: "Book", href: "/book", icon: CalendarPlus },
];

function isActive(pathname: string, href: string, exact?: boolean) {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(href + "/");
}

export function PortalHeader({
  fullName,
  email,
}: {
  fullName: string;
  email: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  const initials =
    fullName
      .split(" ")
      .filter(Boolean)
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "U";
  const firstName = fullName.split(" ")[0] || "there";

  async function handleSignOut() {
    setMenuOpen(false);
    await signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-gray-100 bg-white shadow-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-0 lg:px-6">
          <Link href="/portal" className="flex items-center gap-2.5 py-3">
            <span className="text-[18px] font-black tracking-tight text-[#1a0a3e]">
              urban<span className="text-[#f2c037]">MG</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {NAV.map((item) => {
              const active = isActive(pathname, item.href, item.exact);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={
                    "flex items-center gap-1.5 border-b-2 px-3 py-4 text-[13px] font-medium transition-all hover:text-gray-800 " +
                    (active
                      ? "border-[#f2c037] text-[#f2c037] font-semibold"
                      : "border-transparent text-gray-500")
                  }
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <Link
              href="/book"
              className="hidden items-center gap-1.5 rounded-full bg-[#f2c037] px-4 py-1.5 text-[13px] font-bold text-[#1a0a3e] shadow-sm transition-all hover:bg-[#e8b52e] hover:shadow-md sm:flex"
            >
              <CalendarPlus className="h-3.5 w-3.5" />
              Book
            </Link>

            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-2.5 py-1.5 text-[12px] font-medium text-gray-700 transition-all hover:border-[#f2c037]/50 hover:shadow-sm"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-[#f2c037] to-[#daa520] text-[11px] font-black text-[#1a0a3e]">
                  {initials}
                </div>
                <span className="hidden sm:block">{firstName}</span>
                {menuOpen ? (
                  <ChevronUp className="h-3 w-3 text-gray-400" />
                ) : (
                  <ChevronDown className="h-3 w-3 text-gray-400" />
                )}
              </button>

              {menuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setMenuOpen(false)}
                  />
                  <div className="absolute right-0 top-full z-50 mt-2 w-52 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xl">
                    <div className="border-b border-gray-50 px-4 py-3">
                      <p className="text-[13px] font-semibold text-gray-800">
                        {fullName}
                      </p>
                      <p className="text-[11px] text-gray-400">{email}</p>
                    </div>
                    <div className="py-1">
                      <button
                        onClick={handleSignOut}
                        className="flex w-full items-center gap-2.5 px-4 py-2.5 text-[13px] text-red-500 transition-colors hover:bg-red-50"
                      >
                        <LogOut className="h-3.5 w-3.5" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <nav
        className="fixed bottom-0 inset-x-0 z-50 border-t border-gray-100 bg-white md:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        <div className="grid grid-cols-7">
          {NAV.map((item) => {
            const active = isActive(pathname, item.href, item.exact);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={
                  "flex flex-col items-center justify-center gap-0.5 py-2 transition-colors min-w-0 " +
                  (active ? "text-[#f2c037]" : "text-gray-400")
                }
              >
                <Icon className="h-[18px] w-[18px]" />
                <span className="text-[8px] font-semibold leading-tight truncate w-full text-center px-0.5">
                  {item.mobileLabel}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
