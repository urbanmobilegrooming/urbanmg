"use client";

import { useEffect, useRef } from "react";
import { useInView, useMotionValue, useSpring, motion } from "framer-motion";

export function Counter({
  target,
  duration = 1.8,
  suffix = "",
  prefix = "",
  className,
}: {
  target: number;
  duration?: number;
  suffix?: string;
  prefix?: string;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });
  const value = useMotionValue(0);
  const spring = useSpring(value, { stiffness: 60, damping: 18, duration: duration * 1000 });

  useEffect(() => {
    if (inView) value.set(target);
  }, [inView, target, value]);

  useEffect(() => {
    return spring.on("change", (v) => {
      if (ref.current) {
        ref.current.textContent = `${prefix}${Math.round(v).toLocaleString()}${suffix}`;
      }
    });
  }, [spring, prefix, suffix]);

  return (
    <motion.span ref={ref} className={className} aria-label={`${prefix}${target}${suffix}`}>
      {prefix}0{suffix}
    </motion.span>
  );
}
