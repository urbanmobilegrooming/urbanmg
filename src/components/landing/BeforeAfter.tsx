"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Props = {
  before: string;
  after: string;
  alt?: string;
};

export function BeforeAfter({ before, after, alt = "Before and after" }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState(50);
  const [dragging, setDragging] = useState(false);

  const update = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * 100;
    setPos(Math.max(0, Math.min(100, x)));
  };

  return (
    <div
      ref={containerRef}
      className="relative aspect-[4/3] w-full select-none overflow-hidden rounded-[28px] bg-gray-100 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.15)]"
      onPointerDown={(e) => {
        (e.target as Element).setPointerCapture?.(e.pointerId);
        setDragging(true);
        update(e.clientX);
      }}
      onPointerMove={(e) => dragging && update(e.clientX)}
      onPointerUp={() => setDragging(false)}
      onPointerCancel={() => setDragging(false)}
    >
      {/* After (full) */}
      <Image src={after} alt={`${alt} after`} fill className="object-cover" sizes="(max-width: 1024px) 100vw, 50vw" />
      <div className="absolute left-4 top-4 z-10 rounded-full bg-white/95 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-gray-900 backdrop-blur">
        After
      </div>

      {/* Before (clipped) */}
      <div className="absolute inset-0 overflow-hidden" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
        <Image src={before} alt={`${alt} before`} fill className="object-cover" sizes="(max-width: 1024px) 100vw, 50vw" />
        <div className="absolute right-4 top-4 rounded-full bg-gray-900/85 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white backdrop-blur">
          Before
        </div>
      </div>

      {/* Divider + handle */}
      <motion.div
        className="absolute inset-y-0 z-20 w-px bg-white shadow-[0_0_20px_rgba(0,0,0,0.4)]"
        style={{ left: `${pos}%` }}
        animate={{ x: "-50%" }}
      >
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-[0_8px_30px_rgba(0,0,0,0.25)] ring-2 ring-[#f2c037]/30">
            <ChevronLeft size={14} className="text-gray-700" />
            <ChevronRight size={14} className="text-gray-700" />
          </div>
        </div>
      </motion.div>
    </div>
  );
}
