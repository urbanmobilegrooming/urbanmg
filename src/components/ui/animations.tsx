"use client";

import { motion, useInView, animate, type Variants } from "framer-motion";
import { useEffect, useRef, useState, type ReactNode } from "react";

/*
 * All animation components use `initial={false}` for SSR safety.
 * Content is visible by default (no opacity:0 in SSR HTML).
 * Animations only trigger after hydration via useEffect + useInView.
 */

/* ── Hook: animate only after mount ── */
function useAnimateOnView(ref: React.RefObject<HTMLElement | null>) {
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return { shouldAnimate: mounted, isInView: mounted && isInView };
}

/* ── Fade up on scroll ── */
export function FadeUp({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { isInView } = useAnimateOnView(ref);

  return (
    <motion.div
      ref={ref}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
      initial={false}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ── Fade in from left ── */
export function FadeLeft({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { isInView } = useAnimateOnView(ref);

  return (
    <motion.div
      ref={ref}
      animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -60 }}
      initial={false}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ── Fade in from right ── */
export function FadeRight({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { isInView } = useAnimateOnView(ref);

  return (
    <motion.div
      ref={ref}
      animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 60 }}
      initial={false}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ── Scale up on scroll ── */
export function ScaleUp({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { isInView } = useAnimateOnView(ref);

  return (
    <motion.div
      ref={ref}
      animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.85 }}
      initial={false}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ── Stagger children ── */
const staggerContainer: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
};
const staggerItem: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};

export function StaggerContainer({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const { isInView } = useAnimateOnView(ref);

  return (
    <motion.div
      ref={ref}
      variants={staggerContainer}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className }: { children: ReactNode; className?: string }) {
  return <motion.div variants={staggerItem} className={className}>{children}</motion.div>;
}

/* ── Animated counter for stats ── */
export function AnimatedCounter({
  value,
  suffix = "",
  prefix = "",
  className,
}: {
  value: number;
  suffix?: string;
  prefix?: string;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });
  const [display, setDisplay] = useState(value); // Start with final value for SSR

  useEffect(() => {
    if (!isInView) return;
    setDisplay(0); // Reset to 0, then animate up
    const controls = animate(0, value, {
      duration: 2,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setDisplay(Math.round(v)),
    });
    return controls.stop;
  }, [isInView, value]);

  return (
    <span ref={ref} className={className}>
      {prefix}{display.toLocaleString()}{suffix}
    </span>
  );
}

/* ── Floating animation (hero elements) ── */
export function Float({
  children,
  className,
  duration = 3,
  y = 10,
}: {
  children: ReactNode;
  className?: string;
  duration?: number;
  y?: number;
}) {
  return (
    <motion.div
      animate={{ y: [-y, y, -y] }}
      transition={{ duration, repeat: Infinity, ease: "easeInOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ── Reveal text (slide up from clip) ── */
export function RevealText({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div ref={ref} className="overflow-hidden">
      <motion.div
        animate={mounted ? { y: 0 } : { y: 0 }}
        initial={false}
        transition={{ duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] }}
        className={className}
      >
        {children}
      </motion.div>
    </div>
  );
}

/* ── Glow pulse (for CTA buttons) ── */
export function GlowPulse({
  children,
  className,
  color = "rgba(242, 192, 55, 0.4)",
}: {
  children: ReactNode;
  className?: string;
  color?: string;
}) {
  return (
    <motion.div
      animate={{
        boxShadow: [`0 0 20px ${color}`, `0 0 60px ${color}`, `0 0 20px ${color}`],
      }}
      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ── Magnetic hover (buttons) ── */
export function MagneticHover({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ── Blur fade in ── */
export function BlurFade({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { isInView } = useAnimateOnView(ref);

  return (
    <motion.div
      ref={ref}
      animate={isInView ? { opacity: 1, filter: "blur(0px)" } : { opacity: 0, filter: "blur(10px)" }}
      initial={false}
      transition={{ duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ── Shimmer text effect ── */
export function ShimmerText({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.span
      className={`relative inline-block ${className ?? ""}`}
      style={{
        backgroundImage: "linear-gradient(90deg, currentColor 40%, rgba(255,255,255,0.8) 50%, currentColor 60%)",
        backgroundSize: "200% 100%",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        backgroundClip: "text",
      }}
      animate={{ backgroundPosition: ["200% 0%", "-200% 0%"] }}
      transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
    >
      {children}
    </motion.span>
  );
}

/* ── Card 3D tilt on hover ── */
export function TiltCard({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      whileHover={{ rotateX: -2, rotateY: 5, scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      style={{ transformPerspective: 800 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
