"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus } from "lucide-react";
import type { Dict } from "./dict";

export function Faq({ dict }: { dict: Dict }) {
  const [open, setOpen] = useState<number | null>(0);
  const items = dict.faq.items;

  return (
    <div className="divide-y divide-gray-200">
      {items.map((item, i) => (
        <div key={i}>
          <button
            onClick={() => setOpen(open === i ? null : i)}
            className="flex w-full items-center justify-between gap-6 py-7 text-left transition"
          >
            <span className="text-lg font-semibold text-gray-900 sm:text-xl">{item.q}</span>
            <motion.span
              animate={{ rotate: open === i ? 45 : 0 }}
              transition={{ duration: 0.2 }}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100"
            >
              <Plus size={16} className="text-gray-700" />
            </motion.span>
          </button>
          <AnimatePresence initial={false}>
            {open === i && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                className="overflow-hidden"
              >
                <p className="pb-7 pr-16 text-base leading-relaxed text-gray-600">{item.a}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
}
