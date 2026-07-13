"use client";

import { motion, useScroll, useTransform, useSpring, AnimatePresence } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import {
  Star,
  Phone,
  MapPin,
  Check,
  Instagram,
  Truck,
  Sparkles,
  Heart,
  PawPrint,
  ArrowRight,
  Calendar,
  Bath,
  Scissors,
  Stethoscope,
  Menu,
  X,
  Mail,
} from "lucide-react";
import { BeforeAfter } from "./BeforeAfter";
import { Faq } from "./Faq";
import { InstagramGallery } from "./InstagramGallery";
import { Counter } from "./Counter";
import type { Dict } from "./dict";

const ServiceMap = dynamic(() => import("./ServiceMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center rounded-[28px] bg-brand-cream ring-1 ring-brand-line">
      <div className="flex items-center gap-3 text-brand-muted">
        <span className="h-2 w-2 animate-pulse rounded-full bg-brand-yellow" />
        <span className="text-xs font-bold uppercase tracking-[0.2em]">Loading map</span>
      </div>
    </div>
  ),
});

/* ── Data (visual only — strings translated come from dict) ── */
const SERVICE_VISUALS = [
  { icon: Bath, emoji: "🛁", img: "/booking/urban-bano-1.jpg", featured: false },
  { icon: Scissors, emoji: "✂️", img: "/booking/urban-bano-2.jpg", featured: true },
  { icon: Stethoscope, emoji: "🦷", img: "/booking/dental-prophylaxis.webp", featured: false },
  { icon: Sparkles, emoji: "✨", img: "/booking/service-grooming.jpg", featured: false },
];

const STEP_TONES: Array<"cream" | "ink" | "yellow"> = ["cream", "ink", "cream", "yellow"];
const STEP_NUMBERS = ["01", "02", "03", "04"];

const TESTIMONIALS: { name: string; location: string; quote: string; variant: "white" | "dark" | "yellow" }[] = [
  { name: "Sender Ospina", location: "Google · Verificado", quote: "Excelente atención mi Bella quedó espectacular. El grooming Daniel hace muy bien su trabajo, Dios los bendiga por el servicio y sus excelentes manos.", variant: "white" },
  { name: "Raquel Valiente", location: "Local Guide · Google", quote: "Mi primera vez haciendo un grooming a domicilio y la verdad es mucho más cómodo. El chico que atendió a Leo fue muy amable y me encantó el resultado.", variant: "dark" },
  { name: "Vero V.", location: "Google · Verificado", quote: "Mi mascota Prince, un Teckel, le encanta el servicio que ustedes brindan. Regresa lleno de energía, relajado y con muchos deseos de jugar.", variant: "white" },
  { name: "Sandra Nieto", location: "Google · Verificado", quote: "Realmente me gusta como hacen su trabajo, a mi Greco lo dejan siempre espectacular. Puntuales y amables. Tus mascotas están en buenas manos.", variant: "yellow" },
  { name: "Glenda Belliard", location: "Local Guide · Google", quote: "Los recomiendo altamente. Por más de 14 meses, cada 15 días me bañan a mi príncipe y hacen un excelente trabajo. Son los mejores.", variant: "white" },
  { name: "Ashley Hernández", location: "Google · Verificado", quote: "Me encantó el servicio desde la atención hasta el resultado de mis perritos. Totalmente como se lo pedí. Ernesto, excelente groomer.", variant: "dark" },
  { name: "Monika H. McCormick", location: "Local Guide · Google", quote: "Excelente servicio. Llegaron a tiempo, Ernesto fue muy amable e hizo un increíble trabajo. Mil gracias.", variant: "white" },
  { name: "César M.", location: "Local Guide · Google", quote: "Los busqué por primera vez en Instagram y me atendieron al momento el mismo día. Gracias a Erick por el excelente corte. Son lo máximo.", variant: "yellow" },
  { name: "Marissa Rosas", location: "Google · Verificado", quote: "Mi Rocky quedó hermoso. Felices con su trabajo. Sobre todo con el cariño con que trataron a mi engreído. Definitivamente los recomiendo.", variant: "white" },
  { name: "Yadira Celestrin", location: "Local Guide · Google", quote: "Tengo una Pomeranian, raza bien difícil de trabajar. Quedé súper complacida. Yuraima muy amable y súper profesional.", variant: "dark" },
  { name: "Liuba Mesa Pérez", location: "Local Guide · Google", quote: "Muy profesional y cariñoso Erick con Miki y Mika, mis perritos. Los volveré a llamar. Los recomiendo 💯", variant: "white" },
  { name: "Irek Díaz", location: "Google · Verificado", quote: "Los mejores. He tenido muchos groomings y siempre dejaban mi yorkie horrible. Daniel fue muy amable. Le damos la bienvenida a la familia.", variant: "yellow" },
  { name: "Jovana Correa", location: "Local Guide · Google", quote: "Excelente servicio. Muchas gracias, mi bella quedó hermosa. Los recomiendo 1000%. Yosue y Daniel lo hicieron súper bien 👍", variant: "white" },
  { name: "Vincen Stanzione", location: "Google · Verificado", quote: "Muy buen servicio. Puntuales, profesionales y usan productos de la mejor calidad. Los seguiré llamando para el cuidado de Alex.", variant: "dark" },
  { name: "Karina Escuela", location: "Google · Verificado", quote: "¡Son lo máximo! Manolo, mi pequinés, es muy mal portado y aún así lo trataron como un príncipe. Quedó precioso.", variant: "white" },
];

const AREAS = ["Miami", "Miami Beach", "Coral Gables", "Brickell", "Pinecrest", "Kendall", "Doral", "Key Biscayne", "Aventura", "Cutler Bay", "Homestead", "Fort Lauderdale", "Hollywood", "Pembroke Pines", "Sunrise"];

/* ── Component ── */
export function AnimatedLanding({ dict }: { dict: Dict }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });
  const heroVanY = useTransform(scrollYProgress, [0, 0.15], [0, -80]);
  const heroVanScale = useTransform(scrollYProgress, [0, 0.15], [1, 1.05]);

  const [scrollY, setScrollY] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [splashGone, setSplashGone] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", onScroll, { passive: true });
    const t = setTimeout(() => setSplashGone(true), 900);
    return () => {
      window.removeEventListener("scroll", onScroll);
      clearTimeout(t);
    };
  }, []);

  const navItems = [
    { href: "#about", l: dict.nav.about },
    { href: "#services", l: dict.nav.services },
    { href: "#how", l: dict.nav.how },
    { href: "#area", l: dict.nav.coverage },
    { href: "#reviews", l: dict.nav.reviews },
  ];

  const mobileNavItems = [
    ...navItems,
    { href: "#faq", l: dict.nav.faq },
  ];

  const stats = [
    { target: 1000, suffix: "+", label: dict.stats.happyPets },
    { target: 252, suffix: "+", label: dict.stats.fiveStar },
    { static: <>7<span className="text-brand-yellow">d</span></>, label: dict.stats.daysWeek },
    { static: <>10<span className="text-brand-yellow">h</span></>, label: dict.stats.dailyWindow },
  ] as const;

  return (
    <div ref={containerRef} className="relative min-h-screen overflow-x-hidden bg-brand-cream text-brand-ink antialiased">
      {/* ─── Splash ─── */}
      <AnimatePresence>
        {!splashGone && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-brand-yellow"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            >
              <Image src="/logo-urban.png" alt="Urban Mobile Grooming" width={280} height={80} priority className="h-16 w-auto sm:h-20" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Scroll progress ─── */}
      <motion.div
        style={{ scaleX: progress }}
        className="fixed left-0 right-0 top-0 z-[60] h-[3px] origin-left bg-gradient-to-r from-brand-yellow via-brand-yellow to-brand-blue"
      />

      {/* ─── Header ─── */}
      <motion.header
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.7, duration: 0.5 }}
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
          scrollY > 40 ? "bg-white/92 shadow-[0_6px_30px_-10px_rgba(0,0,0,0.15)] backdrop-blur-md saturate-150" : "bg-transparent"
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6 lg:px-8">
          <Link href="/" className="flex shrink-0 items-center gap-2">
            <Image
              src="/logo-urban.png"
              alt="Urban Mobile Grooming"
              width={150}
              height={42}
              priority
              className={`w-auto transition-all ${scrollY > 40 ? "h-8" : "h-9 sm:h-10"}`}
            />
          </Link>
          <nav className="hidden items-center gap-8 text-sm font-semibold text-brand-ink md:flex">
            {navItems.map((i) => (
              <a key={i.href} href={i.href} className="relative transition hover:text-brand-yellow after:absolute after:bottom-[-4px] after:left-0 after:h-0.5 after:w-0 after:bg-brand-yellow after:transition-all hover:after:w-full">
                {i.l}
              </a>
            ))}
            <Link href={dict.altHref} className="text-[13px] font-bold text-brand-ink/60 hover:text-brand-ink">
              {dict.altLabel}
            </Link>
          </nav>
          <div className="flex items-center gap-2">
            <a href="https://wa.me/17869066700?text=Hi!%20I'd%20like%20to%20book%20a%20grooming%20appointment" target="_blank" rel="noopener" className="hidden items-center gap-1.5 rounded-full bg-brand-ink px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-brand-yellow hover:text-brand-ink md:inline-flex">
              {dict.cta.bookNow} <ArrowRight size={14} />
            </a>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Menu"
              className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-ink text-white md:hidden"
            >
              {menuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: "auto" }}
              exit={{ height: 0 }}
              className="overflow-hidden border-t border-brand-line bg-white md:hidden"
            >
              <nav className="grid gap-1 px-4 py-4 text-sm font-semibold text-brand-ink">
                {mobileNavItems.map((i) => (
                  <a
                    key={i.href}
                    href={i.href}
                    onClick={() => setMenuOpen(false)}
                    className="rounded-lg px-3 py-3 hover:bg-brand-cream"
                  >
                    {i.l}
                  </a>
                ))}
                <Link
                  href={dict.altHref}
                  onClick={() => setMenuOpen(false)}
                  className="rounded-lg px-3 py-2 text-brand-ink/60 hover:bg-brand-cream"
                >
                  {dict.altLabel}
                </Link>
                <a href="https://wa.me/17869066700?text=Hi!%20I'd%20like%20to%20book%20a%20grooming%20appointment" target="_blank" rel="noopener" className="mt-2 inline-flex items-center justify-center rounded-full bg-brand-yellow py-2.5 font-bold text-brand-ink">
                  {dict.cta.bookNow}
                </a>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>

      {/* ═══════════ HERO (yellow gradient) ═══════════ */}
      <section
        className="relative isolate overflow-hidden"
        style={{ background: "linear-gradient(135deg, #FFE16B 0%, #FAB901 60%, #F2C037 100%)" }}
      >
        <div className="absolute -right-32 -top-32 h-[700px] w-[700px] rounded-full bg-white/30 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 h-[500px] w-[500px] rounded-full bg-brand-ink/10 blur-3xl" />
        <div className="paws-bg absolute inset-0 -z-10 opacity-20" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-8 px-4 pb-10 pt-20 sm:px-6 sm:pt-24 lg:grid-cols-2 lg:gap-10 lg:px-8 lg:pb-20 lg:pt-32">
          {/* copy */}
          <div>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.1, duration: 0.5 }}
              className="relative inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.25em] text-brand-ink shadow-[0_8px_30px_-10px_rgba(0,0,0,0.2)] sm:px-4 sm:py-2 sm:text-xs"
            >
              <span className="badge-pulse relative h-2 w-2 rounded-full bg-brand-yellow" />
              {dict.hero.badge}
            </motion.p>

            <h1 className="font-display mt-4 text-[clamp(2rem,9vw,4.8rem)] leading-[0.92] text-brand-ink sm:mt-5 lg:text-6xl">
              <motion.span initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.2, duration: 0.7, ease: [0.16, 1, 0.3, 1] }} className="block">
                {dict.hero.title1}
              </motion.span>
              <motion.span initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.35, duration: 0.7, ease: [0.16, 1, 0.3, 1] }} className="block">
                {dict.hero.title2.replace(/\.$/, "")}<span className="text-white">.</span>
              </motion.span>
              <motion.span
                initial={{ opacity: 0, y: 20, rotate: -3 }}
                animate={{ opacity: 1, y: 0, rotate: -2 }}
                transition={{ delay: 1.55, duration: 0.6 }}
                className="font-accent mt-2 inline-block text-[0.45em] text-brand-ink/80"
              >
                {dict.hero.accent}
              </motion.span>
            </h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.7, duration: 0.5 }}
              className="mt-4 max-w-xl text-[13px] leading-relaxed text-brand-ink/75 sm:mt-5 sm:text-base"
            >
              {dict.hero.desc} <strong>{dict.hero.descStrong}</strong>
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.85, duration: 0.5 }}
              className="mt-6 flex flex-wrap items-center gap-3 sm:mt-8"
            >
              <a
                href="https://wa.me/17869066700?text=Hi!%20I'd%20like%20to%20book%20a%20grooming%20appointment"
                target="_blank"
                rel="noopener"
                className="group inline-flex items-center justify-center gap-2 rounded-full bg-brand-ink px-6 py-3 text-sm font-bold text-white shadow-[0_20px_50px_-15px_rgba(0,0,0,0.6)] transition hover:bg-white hover:text-brand-ink sm:px-7 sm:py-3.5 sm:text-base"
              >
                {dict.cta.bookAppointment}
                <span className="inline-block transition group-hover:translate-x-1">→</span>
              </a>
              <a
                href="https://wa.me/17869066700?text=Hi!%20I'd%20like%20to%20book%20a%20grooming%20appointment"
                target="_blank"
                rel="noopener"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-bold text-brand-ink transition hover:bg-brand-ink hover:text-white sm:px-7 sm:py-3.5 sm:text-base"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                  <path d="M.057 24l1.687-6.163a11.867 11.867 0 01-1.587-5.946C.16 5.335 5.495 0 12.05 0a11.817 11.817 0 018.413 3.488 11.824 11.824 0 013.48 8.413c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 01-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 001.522 5.273l-.999 3.648 3.966-1.62zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.867-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.71.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.247-.694.247-1.289.173-1.413z"/>
                </svg>
                {dict.cta.whatsapp}
              </a>
            </motion.div>

            <motion.dl
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 2, duration: 0.5 }}
              className="mt-7 grid max-w-lg grid-cols-3 gap-x-3 gap-y-4 border-t border-brand-ink/10 pt-5 sm:mt-9 sm:gap-x-6 sm:border-0 sm:pt-0"
            >
              <div className="min-w-0">
                <dt className="text-[9px] font-bold uppercase tracking-wider text-brand-ink/50 sm:text-xs">{dict.hero.rating}</dt>
                <dd className="mt-1 text-xs font-bold sm:text-base">
                  ★★★★★ <span className="font-normal text-brand-ink/60">250+</span>
                </dd>
              </div>
              <div className="min-w-0">
                <dt className="text-[9px] font-bold uppercase tracking-wider text-brand-ink/50 sm:text-xs">{dict.hero.area}</dt>
                <dd className="mt-1 text-xs font-bold leading-tight sm:text-base">{dict.hero.areaValue}</dd>
              </div>
              <div className="min-w-0">
                <dt className="text-[9px] font-bold uppercase tracking-wider text-brand-ink/50 sm:text-xs">{dict.hero.hours}</dt>
                <dd className="mt-1 text-xs font-bold leading-tight sm:text-base">8AM–6PM</dd>
              </div>
            </motion.dl>
          </div>

          {/* van */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, x: 40 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ delay: 1, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            style={{ y: heroVanY, scale: heroVanScale }}
            className="relative order-first lg:order-last"
          >
            <div className="absolute -inset-8 -z-10 rounded-full bg-brand-yellow/25 blur-3xl" />
            <div className="animate-floaty">
              <Image
                src="/booking/van-2026.png"
                alt="Urban Mobile Grooming van — door-to-door pet spa in Miami"
                width={1400}
                height={1400}
                priority
                className="mx-auto w-full max-w-xs drop-shadow-2xl sm:max-w-md md:max-w-lg lg:ml-auto lg:max-w-xl"
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════ MARQUEE ═══════════ */}
      <section className="overflow-hidden bg-brand-ink py-1.5 text-white sm:py-2">
        <div className="marquee-track font-display flex gap-6 whitespace-nowrap text-[11px] uppercase sm:gap-8 sm:text-xs">
          {Array(2).fill(0).map((_, dup) => (
            <div key={dup} className="flex shrink-0 gap-6 sm:gap-8">
              {dict.marquee.map((item, idx) => (
                <span key={idx}>{item}</span>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════ STATS BAND ═══════════ */}
      <section className="bg-brand-cream py-8 sm:py-10 lg:py-14">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-4 text-center sm:px-6 md:grid-cols-4 lg:gap-10 lg:px-8">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
            >
              <p className="font-display text-4xl text-brand-ink lg:text-6xl">
                {"static" in s ? s.static : <Counter target={s.target} suffix={s.suffix} />}
              </p>
              <p className="mt-2 text-xs font-bold uppercase tracking-[0.2em] text-brand-soft sm:text-sm">
                {s.label}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ═══════════ ABOUT ═══════════ */}
      <section id="about" className="bg-brand-cream py-10 sm:py-12 lg:py-16">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 sm:px-6 lg:gap-16 lg:grid-cols-2 lg:px-8">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            className="relative"
          >
            <div className="overflow-hidden rounded-3xl bg-white p-8">
              <Image
                src="/booking/dog-illust.png"
                alt="Dog grooming illustration"
                width={1019}
                height={724}
                className="aspect-[4/5] w-full animate-kenburns object-contain"
              />
            </div>
            <div className="absolute -bottom-3 -right-2 rounded-2xl bg-brand-yellow px-5 py-4 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.25)] sm:-bottom-6 sm:-right-6 sm:px-6 sm:py-5">
              <p className="font-display text-4xl leading-none text-brand-ink">
                <Counter target={1000} suffix="+" />
              </p>
              <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-brand-ink/80">{dict.about.badgeLabel}</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
          >
            <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.25em] text-brand-ink/60 before:h-px before:w-8 before:bg-brand-yellow before:content-['']">
              &nbsp;{dict.about.eyebrow}
            </p>
            <h2 className="font-display mt-3 text-3xl text-brand-ink sm:text-4xl lg:text-5xl">
              {dict.about.title1}
              <br />
              {dict.about.title2}
            </h2>
            <p className="mt-6 text-base leading-relaxed sm:text-lg text-brand-soft">
              {dict.about.body}
            </p>
            <ul className="mt-8 space-y-3 text-brand-soft">
              {dict.about.bullets.map((t) => (
                <li key={t} className="flex items-start gap-3">
                  <span className="mt-1 flex h-5 w-5 items-center justify-center rounded-full bg-brand-yellow text-xs font-bold text-brand-ink">
                    ✓
                  </span>
                  {t}
                </li>
              ))}
            </ul>
            <a
              href="https://wa.me/17869066700?text=Hi!%20I'd%20like%20to%20book%20a%20grooming%20appointment"
              target="_blank"
              rel="noopener"
              className="mt-10 inline-flex items-center gap-2 rounded-full bg-brand-ink px-6 py-3 font-semibold text-white transition hover:bg-brand-yellow hover:text-brand-ink"
            >
              {dict.cta.makeAppointment} <ArrowRight size={15} />
            </a>
          </motion.div>
        </div>
      </section>

      {/* ═══════════ SERVICES (dark) ═══════════ */}
      <section id="services" className="relative overflow-hidden bg-brand-ink py-14 text-white lg:py-20">
        <div className="absolute -right-32 top-1/2 h-[500px] w-[500px] rounded-full bg-brand-yellow/15 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 h-[400px] w-[400px] rounded-full bg-brand-blue/15 blur-3xl" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} className="max-w-2xl">
            <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.25em] text-white/60 before:h-px before:w-8 before:bg-brand-yellow before:content-['']">
              &nbsp;{dict.services.eyebrow}
            </p>
            <h2 className="font-display mt-3 text-3xl sm:text-4xl lg:text-5xl">
              {dict.services.title}
            </h2>
          </motion.div>

          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {dict.services.items.map((item, i) => {
              const visual = SERVICE_VISUALS[i];
              const featured = visual.featured;
              return (
                <motion.article
                  key={item.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ delay: i * 0.1, duration: 0.5 }}
                  whileHover={{ y: -10 }}
                  className={`group relative overflow-hidden rounded-3xl ${
                    featured
                      ? "bg-brand-yellow text-brand-ink shadow-[0_30px_80px_-20px_rgba(250,185,1,0.5)]"
                      : "bg-white/5 ring-1 ring-white/10 backdrop-blur"
                  }`}
                >
                  <div className="aspect-[5/3] overflow-hidden">
                    <Image
                      src={visual.img}
                      alt={item.title}
                      width={800}
                      height={500}
                      className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                    />
                  </div>
                  <div className="relative p-5">
                    <span className={`absolute -top-5 right-5 inline-flex h-10 w-10 items-center justify-center rounded-xl text-lg shadow-lg ${
                      featured ? "bg-brand-ink text-brand-yellow" : "bg-brand-yellow text-brand-ink"
                    }`}>
                      {visual.emoji}
                    </span>
                    {featured && "badge" in item && item.badge && (
                      <p className="text-[10px] font-black uppercase tracking-[0.25em]">{item.badge}</p>
                    )}
                    <h3 className={`font-display ${featured ? "mt-1" : ""} text-xl sm:text-2xl`}>{item.title}</h3>
                    <p className={`mt-2 text-sm leading-relaxed ${featured ? "text-brand-ink/80" : "text-white/70"}`}>
                      {item.desc}
                    </p>
                  </div>
                </motion.article>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════ HOW IT WORKS ═══════════ */}
      <section id="how" className="relative overflow-hidden bg-white py-10 sm:py-12 lg:py-16">
        <div className="absolute -right-32 top-1/2 h-[400px] w-[400px] rounded-full bg-brand-yellow/10 blur-3xl" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} className="max-w-2xl">
            <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.25em] text-brand-ink/60 before:h-px before:w-8 before:bg-brand-yellow before:content-['']">
              &nbsp;{dict.how.eyebrow}
            </p>
            <h2 className="font-display mt-3 text-3xl text-brand-ink sm:text-4xl lg:text-5xl">
              {dict.how.title}
            </h2>
            <p className="mt-4 text-base text-brand-soft sm:text-lg">{dict.how.sub}</p>
          </motion.div>

          <ol className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {dict.how.steps.map((step, i) => {
              const toneKey = STEP_TONES[i];
              const n = STEP_NUMBERS[i];
              const tone =
                toneKey === "ink"
                  ? "bg-brand-ink text-white shadow-[0_20px_50px_-15px_rgba(0,0,0,0.4)]"
                  : toneKey === "yellow"
                  ? "bg-brand-yellow text-brand-ink shadow-[0_20px_50px_-15px_rgba(250,185,1,0.5)]"
                  : "bg-brand-cream text-brand-ink shadow-[0_20px_50px_-15px_rgba(0,0,0,0.08)]";
              const descTone = toneKey === "ink" ? "text-white/70" : toneKey === "yellow" ? "text-brand-ink/80" : "text-brand-soft";
              const numBg = toneKey === "yellow" ? "bg-brand-ink text-brand-yellow" : "bg-brand-yellow text-brand-ink";
              return (
                <motion.li
                  key={n}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ delay: i * 0.1 }}
                  className={`relative rounded-2xl p-5 ${tone}`}
                >
                  <span className={`font-display absolute -top-3.5 left-5 inline-flex h-10 w-10 items-center justify-center rounded-full text-base ${numBg}`}>
                    {n}
                  </span>
                  <h3 className="font-display mt-3 text-lg">{step.title}</h3>
                  <p className={`mt-1.5 text-[13px] leading-relaxed ${descTone}`}>{step.desc}</p>
                </motion.li>
              );
            })}
          </ol>
        </div>
      </section>

      {/* ═══════════ DENTAL ═══════════ */}
      <section id="dental" className="relative overflow-hidden bg-brand-blue py-14 text-white lg:py-20">
        <div className="absolute -right-32 -top-32 h-[500px] w-[500px] rounded-full bg-white/5 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 h-[400px] w-[400px] rounded-full bg-brand-yellow/10 blur-3xl" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 sm:px-6 lg:gap-16 lg:grid-cols-2 lg:px-8">
          <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: "-100px" }}>
            <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.25em] text-white/60 before:h-px before:w-8 before:bg-brand-yellow before:content-['']">
              &nbsp;{dict.dental.eyebrow}
            </p>
            <h2 className="font-display mt-3 text-3xl sm:text-4xl lg:text-5xl">
              {dict.dental.title1}
              <br />
              {dict.dental.title2}
            </h2>
            <p className="mt-6 text-base leading-relaxed sm:text-lg text-white/80">
              {dict.dental.body}
            </p>
            <ul className="mt-8 space-y-3">
              {dict.dental.bullets.map((t) => (
                <li key={t} className="flex items-start gap-3">
                  <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-brand-yellow" />
                  <span className="text-white/90">{t}</span>
                </li>
              ))}
            </ul>
            <p className="mt-8 font-display text-2xl text-brand-yellow sm:text-3xl">{dict.dental.price}</p>
            <a
              href="https://wa.me/17869066700?text=Hi!%20I'd%20like%20to%20book%20a%20non-anesthetic%20dental%20cleaning"
              target="_blank"
              rel="noopener"
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-brand-yellow px-7 py-3.5 font-bold text-brand-ink transition hover:bg-brand-yellow-light"
            >
              {dict.cta.bookDental} <ArrowRight size={15} />
            </a>
          </motion.div>
          <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: "-100px" }} className="relative">
            <Image
              src="/booking/urban-bano-3.jpg"
              alt="Dog dental cleaning"
              width={1000}
              height={1000}
              className="aspect-square w-full rounded-3xl object-cover shadow-2xl"
            />
            <div className="absolute -bottom-3 left-3 max-w-[220px] rounded-2xl bg-brand-yellow px-4 py-3 text-brand-ink shadow-[0_20px_50px_-15px_rgba(250,185,1,0.6)] sm:-bottom-6 sm:-left-6 sm:max-w-[240px] sm:px-5 sm:py-4">
              <p className="font-display text-xl leading-tight">{dict.dental.callout1}</p>
              <p className="mt-1 text-xs font-semibold text-brand-ink/70">{dict.dental.callout2}</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════ BEFORE / AFTER ═══════════ */}
      <section className="bg-brand-cream py-10 sm:py-12 lg:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-10 lg:gap-14 lg:grid-cols-12">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} className="lg:col-span-5">
              <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.25em] text-brand-ink/60 before:h-px before:w-8 before:bg-brand-yellow before:content-['']">
                &nbsp;{dict.beforeAfter.eyebrow}
              </p>
              <h2 className="font-display mt-3 text-3xl text-brand-ink sm:text-4xl lg:text-5xl">
                {dict.beforeAfter.title1}
                <br />
                {dict.beforeAfter.title2}
              </h2>
              <p className="mt-6 max-w-md text-lg leading-relaxed text-brand-soft">
                {dict.beforeAfter.body}
              </p>
              <div className="mt-7 flex items-center gap-3">
                <Sparkles size={20} className="text-brand-yellow" />
                <span className="text-sm font-semibold text-brand-soft">
                  {dict.beforeAfter.note}
                </span>
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true, margin: "-100px" }} className="lg:col-span-7">
              <BeforeAfter before="/booking/gallery-4-urban-bano.jpg" after="/booking/gallery-3-chanel.png" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* GALLERY (Instagram) — hidden until Behold feed-id is configured.
          Re-enable by uncommenting and setting NEXT_PUBLIC_BEHOLD_FEED_ID in .env.local */}
      {false && (
        <section id="gallery" className="bg-brand-cream py-10 sm:py-12 lg:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} className="mb-8 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.25em] text-brand-ink/60 before:h-px before:w-8 before:bg-brand-yellow before:content-['']">
                  &nbsp;{dict.gallery.eyebrow}
                </p>
                <h2 className="font-display mt-3 text-3xl text-brand-ink sm:text-4xl lg:text-5xl">
                  {dict.gallery.title} <span className="text-brand-yellow">{dict.gallery.handle}</span>
                </h2>
              </div>
              <a
                href="https://www.instagram.com/urbanmobilegrooming/"
                target="_blank"
                rel="noopener"
                className="inline-flex items-center gap-2 rounded-full bg-brand-ink px-5 py-2.5 text-sm font-bold text-white transition hover:bg-brand-yellow hover:text-brand-ink"
              >
                <Instagram size={15} />
                {dict.cta.follow}
              </a>
            </motion.div>

            <InstagramGallery />

            <div className="mt-8 text-center">
              <a
                href="https://www.instagram.com/urbanmobilegrooming/"
                target="_blank"
                rel="noopener"
                className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-bold ring-1 ring-brand-ink/15 transition hover:bg-brand-ink hover:text-white"
              >
                {dict.cta.seeMore} <ArrowRight size={13} />
              </a>
            </div>
          </div>
        </section>
      )}

      {/* ═══════════ TESTIMONIALS (2-row marquee) ═══════════ */}
      <section id="reviews" className="overflow-hidden bg-white py-10 sm:py-12 lg:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.25em] text-brand-ink/60 before:h-px before:w-8 before:bg-brand-yellow before:content-['']">
                &nbsp;{dict.reviews.eyebrow}
              </p>
              <h2 className="font-display mt-3 text-3xl text-brand-ink sm:text-4xl lg:text-5xl">
                {dict.reviews.title}
              </h2>
            </div>
            <div className="flex items-center gap-2 rounded-full bg-brand-cream px-4 py-2">
              <span className="text-lg text-brand-yellow">★★★★★</span>
              <span className="text-sm font-bold text-brand-ink">{dict.reviews.aggregate}</span>
            </div>
          </motion.div>
        </div>

        <div className="relative mt-12">
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-gradient-to-r from-white sm:w-24 to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-white sm:w-24 to-transparent" />

          {[0, 1].map((row) => {
            const slice = row === 0 ? TESTIMONIALS.slice(0, 8) : TESTIMONIALS.slice(7);
            return (
              <div key={row} className={`overflow-hidden ${row === 1 ? "mt-4" : ""}`}>
                <div
                  className="marquee-track flex gap-4 whitespace-normal"
                  style={row === 1 ? { animationDuration: "55s", animationDirection: "normal" } : { animationDuration: "45s" }}
                >
                  {[...slice, ...slice].map((t, i) => {
                    const tone =
                      t.variant === "dark"
                        ? "bg-brand-ink text-white"
                        : t.variant === "yellow"
                        ? "bg-brand-yellow text-brand-ink"
                        : "bg-brand-cream text-brand-ink ring-1 ring-brand-line";
                    const quoteTone =
                      t.variant === "dark" ? "text-white/85" : t.variant === "yellow" ? "text-brand-ink/85" : "text-brand-soft";
                    const metaTone =
                      t.variant === "dark" ? "text-white/50" : t.variant === "yellow" ? "text-brand-ink/60" : "text-brand-muted";
                    return (
                      <figure
                        key={`${row}-${i}`}
                        className={`flex w-[260px] shrink-0 flex-col rounded-2xl p-4 sm:w-[340px] sm:p-5 ${tone}`}
                      >
                        <div className="text-sm text-brand-yellow">★★★★★</div>
                        <blockquote className={`mt-2 text-[13px] leading-relaxed line-clamp-5 ${quoteTone}`}>
                          &ldquo;{t.quote}&rdquo;
                        </blockquote>
                        <figcaption className="mt-3">
                          <div className="text-[13px] font-bold">{t.name}</div>
                          <div className={`text-[10px] font-medium uppercase tracking-wider ${metaTone}`}>{t.location}</div>
                        </figcaption>
                      </figure>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ═══════════ COVERAGE MAP ═══════════ */}
      <section id="area" className="relative overflow-hidden bg-white py-8 sm:py-10 lg:py-14">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:px-8">
          <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: "-100px" }}>
            <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.25em] text-brand-ink/60 before:h-px before:w-8 before:bg-brand-yellow before:content-['']">
              &nbsp;{dict.area.eyebrow}
            </p>
            <h2 className="font-display mt-3 text-3xl text-brand-ink sm:text-4xl lg:text-5xl">
              {dict.area.title}
            </h2>
            <p className="mt-4 text-base text-brand-soft sm:text-lg">
              {dict.area.body}
            </p>

            <div className="mt-6 grid max-w-md grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-brand-cream px-4 py-3">
                <p className="text-xs font-bold uppercase tracking-wider text-brand-muted">Miami-Dade</p>
                <p className="mt-1 text-sm font-semibold text-brand-ink">Miami · Miami Beach · Coral Gables · Brickell · Pinecrest · Doral</p>
              </div>
              <div className="rounded-2xl bg-brand-cream px-4 py-3">
                <p className="text-xs font-bold uppercase tracking-wider text-brand-muted">Parts of Broward</p>
                <p className="mt-1 text-sm font-semibold text-brand-ink">Fort Lauderdale · Pembroke Pines · Hollywood · Sunrise · Aventura</p>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              {AREAS.map((a) => (
                <span key={a} className="inline-flex items-center gap-1.5 rounded-full bg-brand-cream px-3 py-1 text-xs font-semibold text-brand-ink">
                  <Check size={11} className="text-brand-yellow" />
                  {a}
                </span>
              ))}
            </div>

            <a
              href="https://wa.me/17869066700?text=Hi!%20Do%20you%20cover%20my%20zip%20code%3F"
              target="_blank"
              rel="noopener"
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-brand-ink px-6 py-3 font-bold text-white transition hover:bg-brand-yellow hover:text-brand-ink"
            >
              {dict.cta.askZip} <ArrowRight size={15} />
            </a>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: "-100px" }} className="h-[380px] w-full sm:aspect-square sm:h-auto lg:aspect-auto lg:h-[560px]">
            <ServiceMap />
          </motion.div>
        </div>
      </section>

      {/* ═══════════ FAQ ═══════════ */}
      <section id="faq" className="bg-brand-cream py-10 sm:py-12 lg:py-16">
        <div className="mx-auto grid max-w-7xl gap-14 px-6 lg:grid-cols-12 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} className="lg:col-span-5">
            <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.25em] text-brand-ink/60 before:h-px before:w-8 before:bg-brand-yellow before:content-['']">
              &nbsp;{dict.faq.eyebrow}
            </p>
            <h2 className="font-display mt-3 text-3xl text-brand-ink sm:text-4xl lg:text-5xl">
              {dict.faq.title}
            </h2>
            <p className="mt-5 text-base leading-relaxed text-brand-soft">
              {dict.faq.sub}
            </p>
            <a href="tel:+17869066700" className="mt-3 inline-flex items-center gap-2 text-sm font-bold text-brand-ink hover:text-brand-yellow">
              {dict.faq.cta} <ArrowRight size={14} />
            </a>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} className="lg:col-span-7">
            <Faq dict={dict} />
          </motion.div>
        </div>
      </section>

      {/* ═══════════ CONTACT (dark) ═══════════ */}
      <section id="contact" className="relative overflow-hidden bg-brand-ink py-14 text-white lg:py-20">
        <div className="absolute -left-32 top-1/2 h-[500px] w-[500px] -translate-y-1/2 rounded-full bg-brand-yellow/20 blur-3xl" />
        <div className="absolute -right-32 -top-32 h-[400px] w-[400px] rounded-full bg-brand-blue/20 blur-3xl" />
        <div className="relative mx-auto grid max-w-7xl items-start gap-10 px-4 sm:px-6 lg:gap-16 lg:grid-cols-2 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} className="w-full text-center lg:text-left">
            <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.25em] text-white/60 before:h-px before:w-8 before:bg-brand-yellow before:content-['']">
              &nbsp;{dict.contact.eyebrow}
            </p>
            <h2 className="font-display mt-3 text-3xl sm:text-4xl lg:text-5xl">
              {dict.contact.title1}
              <br />
              {dict.contact.title2}
            </h2>
            <p className="mt-6 text-base leading-relaxed sm:text-lg text-white/70">
              {dict.contact.body}
            </p>

            <dl className="mt-12 space-y-8 text-left">
              <div className="flex items-start gap-5">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-yellow">
                  <MapPin size={20} className="text-brand-ink" />
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wider text-white/50">{dict.contact.serviceArea}</dt>
                  <dd className="mt-1 text-lg font-semibold">{dict.contact.serviceAreaValue}</dd>
                </div>
              </div>
              <div className="flex items-start gap-5">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-yellow">
                  <Phone size={20} className="text-brand-ink" />
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wider text-white/50">{dict.contact.phone}</dt>
                  <dd className="mt-1 text-lg font-semibold">
                    <a href="tel:+17869066700" className="hover:text-brand-yellow">786-906-6700</a>
                  </dd>
                </div>
              </div>
              <div className="flex items-start gap-5">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-yellow">
                  <Mail size={20} className="text-brand-ink" />
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wider text-white/50">{dict.contact.email}</dt>
                  <dd className="mt-1 text-lg font-semibold">
                    <a href="mailto:urbanmobilegrooming@gmail.com" className="hover:text-brand-yellow">
                      urbanmobilegrooming@gmail.com
                    </a>
                  </dd>
                </div>
              </div>
            </dl>
          </motion.div>

          <div className="w-full rounded-3xl bg-white/5 p-6 text-center ring-1 ring-white/10 backdrop-blur sm:p-12 lg:text-left">
            <PawPrint size={36} className="mx-auto text-brand-yellow lg:mx-0" strokeWidth={1.5} />
            <h3 className="font-display mt-5 text-3xl sm:text-4xl">
              {dict.contact.cardTitle}
            </h3>
            <p className="mt-4 text-white/70">
              {dict.contact.cardBody}
            </p>
            <a
              href="https://wa.me/17869066700?text=Hi!%20I'd%20like%20to%20book%20a%20grooming%20appointment"
              target="_blank"
              rel="noopener"
              className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-full bg-brand-yellow px-8 py-4 text-base font-bold text-brand-ink transition hover:bg-white"
            >
              {dict.cta.bookOnline} <ArrowRight size={16} />
            </a>
            <a
              href="https://wa.me/17869066700"
              target="_blank"
              rel="noopener"
              className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/15 px-8 py-4 text-base font-semibold text-white transition hover:border-white/30"
            >
              <svg viewBox="0 0 32 32" fill="currentColor" className="h-4 w-4">
                <path d="M16.001 0C7.166 0 .002 7.164.002 16c0 2.823.737 5.578 2.139 8.005L0 32l8.205-2.122A15.93 15.93 0 0 0 16 32C24.836 32 32 24.836 32 16c0-4.275-1.665-8.294-4.689-11.318C24.288 1.659 20.269 0 16.001 0zm0 29.328c-2.378 0-4.71-.64-6.748-1.85l-.484-.288-5.013 1.296 1.336-4.886-.315-.5A13.27 13.27 0 0 1 2.668 16c0-7.351 5.98-13.331 13.333-13.331a13.24 13.24 0 0 1 9.428 3.908A13.24 13.24 0 0 1 29.336 16c-.001 7.352-5.982 13.328-13.335 13.328zm7.331-9.984c-.4-.2-2.378-1.174-2.747-1.308-.368-.135-.638-.2-.906.2-.27.4-1.04 1.308-1.275 1.578-.235.27-.469.3-.87.1-2.379-1.19-3.94-2.122-5.506-4.81-.416-.716.416-.665 1.19-2.214.135-.27.067-.5-.034-.7-.1-.2-.906-2.182-1.241-2.989-.327-.785-.66-.677-.906-.69-.235-.012-.502-.013-.768-.013a1.47 1.47 0 0 0-1.07.502c-.368.4-1.41 1.378-1.41 3.36 0 1.982 1.443 3.898 1.643 4.165.2.27 2.838 4.336 6.876 6.084 2.564 1.107 3.568 1.2 4.85 1.01.78-.117 2.378-.972 2.713-1.91.335-.94.335-1.745.235-1.91-.1-.166-.367-.27-.768-.467z"/>
              </svg>
              {dict.cta.sendWhatsapp}
            </a>
          </div>
        </div>
      </section>

      {/* ═══════════ FOOTER ═══════════ */}
      <footer className="bg-brand-ink py-10 text-white/60">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-6 text-center sm:flex-row sm:text-left lg:px-8">
          <Image src="/booking/logo-white.png" alt="Urban Mobile Grooming" width={160} height={42} className="h-10 w-auto" />
          <p className="text-sm">
            © {new Date().getFullYear()} Urban Mobile Grooming · {dict.footer.rights}
          </p>
          <div className="flex gap-3">
            <a href="https://instagram.com/urbanmobilegrooming" target="_blank" rel="noopener" className="flex h-11 w-11 items-center justify-center rounded-full ring-1 ring-white/15 transition hover:bg-brand-yellow hover:text-brand-ink">
              <Instagram size={15} />
            </a>
            <a href="tel:+17869066700" className="flex h-11 w-11 items-center justify-center rounded-full ring-1 ring-white/15 transition hover:bg-brand-yellow hover:text-brand-ink">
              <Phone size={15} />
            </a>
          </div>
        </div>
      </footer>

      {/* WhatsApp FAB — clearly WhatsApp green, compact, no big pulse */}
      <motion.a
        href="https://wa.me/17869066700"
        target="_blank"
        rel="noopener"
        aria-label="WhatsApp"
        initial={{ opacity: 0, scale: 0.5, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ delay: 1.2, type: "spring", stiffness: 180, damping: 14 }}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
        className="group fixed bottom-4 right-4 z-40 flex h-12 items-center gap-2 overflow-hidden rounded-full bg-[#25D366] pl-2.5 pr-3 text-white shadow-[0_10px_25px_-8px_rgba(37,211,102,0.55)] ring-2 ring-white/20 transition-all md:bottom-5 md:right-5"
      >
        <svg viewBox="0 0 32 32" fill="currentColor" className="h-6 w-6 shrink-0">
          <path d="M16.001 0C7.166 0 .002 7.164.002 16c0 2.823.737 5.578 2.139 8.005L0 32l8.205-2.122A15.93 15.93 0 0 0 16 32C24.836 32 32 24.836 32 16c0-4.275-1.665-8.294-4.689-11.318C24.288 1.659 20.269 0 16.001 0zm0 29.328c-2.378 0-4.71-.64-6.748-1.85l-.484-.288-5.013 1.296 1.336-4.886-.315-.5A13.27 13.27 0 0 1 2.668 16c0-7.351 5.98-13.331 13.333-13.331a13.24 13.24 0 0 1 9.428 3.908A13.24 13.24 0 0 1 29.336 16c-.001 7.352-5.982 13.328-13.335 13.328zm7.331-9.984c-.4-.2-2.378-1.174-2.747-1.308-.368-.135-.638-.2-.906.2-.27.4-1.04 1.308-1.275 1.578-.235.27-.469.3-.87.1-2.379-1.19-3.94-2.122-5.506-4.81-.416-.716.416-.665 1.19-2.214.135-.27.067-.5-.034-.7-.1-.2-.906-2.182-1.241-2.989-.327-.785-.66-.677-.906-.69-.235-.012-.502-.013-.768-.013a1.47 1.47 0 0 0-1.07.502c-.368.4-1.41 1.378-1.41 3.36 0 1.982 1.443 3.898 1.643 4.165.2.27 2.838 4.336 6.876 6.084 2.564 1.107 3.568 1.2 4.85 1.01.78-.117 2.378-.972 2.713-1.91.335-.94.335-1.745.235-1.91-.1-.166-.367-.27-.768-.467z"/>
        </svg>
        <span className="hidden text-[13px] font-bold sm:inline">
          {dict.cta.chatWithUs}
        </span>
      </motion.a>
    </div>
  );
}
