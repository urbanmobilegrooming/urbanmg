"use client";

import Link from "next/link";
import { PawPrint } from "lucide-react";

export default function PortalError() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="max-w-md rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center">
        <PawPrint className="mx-auto mb-3 h-8 w-8 text-amber-400" />
        <p className="text-[15px] font-bold text-amber-700">
          Your account isn&apos;t linked to a client profile yet.
        </p>
        <p className="mt-1 text-[13px] text-amber-600">
          Please contact the office so we can connect your account, or head back home.
        </p>
        <Link
          href="/"
          className="mt-4 inline-block rounded-xl bg-[#f2c037] px-5 py-2.5 text-sm font-bold text-[#1a0a3e] hover:bg-[#e5a818]"
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}
