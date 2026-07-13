"use client";
import Image from "next/image";

import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { createPublicBooking } from "@/server/booking";
import {
  Check,
  ChevronRight,
  ChevronLeft,
  Phone,
  Mail,
  MapPin,
  Clock,
  Star,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
interface Category {
  id: string;
  name: string;
}
interface Service {
  id: string;
  name: string;
  category_id: string;
  duration_minutes: number;
  base_price: number;
}
interface Staff {
  id: string;
  first_name: string;
  last_name: string;
  color: string;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */
const HERO_SERVICES = [
  {
    title: "Bath",
    desc: "Shampoo, conditioner, anal gland, ears cleaning, hair dryer, nail cut & grinding, cologne.",
    img: "/booking/service-bath.jpg",
  },
  {
    title: "Full Grooming",
    desc: "Everything in Bath plus professional haircut styled to breed standard or your preference.",
    img: "/booking/service-grooming.jpg",
  },
  {
    title: "Dental Prophylaxis",
    desc: "Non-anesthetic dental cleaning. Remove tartar and plaque for fresh breath and healthy gums.",
    img: "/booking/dental-prophylaxis.webp",
  },
];

const TESTIMONIALS = [
  {
    name: "Vincen Stanzione",
    text: "Muy buen servicio. Puntuales, profesionales y usan productos de la mejor calidad. Los seguire llamando para el cuidado de Alex.",
  },
  {
    name: "Karina Escuela",
    text: "Son lo maximo!! Manolo, mi perro pequines, es muy mal portado y aun asi aceptaron atenderlo, la groomer es tan carinosa que se porto como un principe.",
  },
  {
    name: "Sinin72",
    text: "Son muy tiernos con las mascotas, mi amada Lucy, mi gatica hermosa se quedo tranquila mientras la banaban. Quedo hermosa!!!",
  },
];

const AREAS = [
  "Miami",
  "Coral Gables",
  "Brickell",
  "Pinecrest",
  "Kendall",
  "Doral",
  "Key Biscayne",
  "South Miami",
  "Homestead",
  "Cutler Bay",
  "Pembroke Pines",
  "Florida City",
];

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */
export function BookingLanding({
  categories,
  services,
  staff,
}: {
  categories: Category[];
  services: Service[];
  staff: Staff[];
}) {
  const [showForm, setShowForm] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);

  function scrollToForm() {
    setShowForm(true);
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  }

  return (
    <div className="min-h-screen bg-brand-cream text-brand-ink font-[family-name:var(--font-montserrat)] antialiased">
      {/* ── Sticky Header ── */}
      <header className="sticky top-0 z-50 border-b border-brand-line/60 bg-white/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <a href="/" aria-label="Home" className="flex shrink-0 items-center">
            <Image src="/logo-urban.png" alt="Urban Mobile Grooming" width={150} height={42} className="h-9 w-auto sm:h-10" />
          </a>
          <div className="flex items-center gap-2">
            <a href="tel:+17869066700" className="hidden items-center gap-2 rounded-full border border-brand-line px-4 py-2 text-sm font-semibold text-brand-ink transition hover:border-brand-ink sm:inline-flex">
              <Phone size={13} />
              786-906-6700
            </a>
            <button
              onClick={scrollToForm}
              className="rounded-full bg-brand-ink px-5 py-2 text-sm font-bold text-white transition hover:bg-brand-yellow hover:text-brand-ink"
            >
              Book Now
            </button>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative isolate overflow-hidden" style={{ background: "linear-gradient(135deg, #FFE16B 0%, #FAB901 60%, #F2C037 100%)" }}>
        <div className="paws-bg absolute inset-0 -z-10 opacity-20" />
        <motion.div className="pointer-events-none absolute -right-20 -top-20 h-96 w-96 rounded-full bg-white/20 blur-3xl" animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 20, repeat: Infinity }} />
        <motion.div className="pointer-events-none absolute -bottom-32 -left-32 h-64 w-64 rounded-full bg-brand-ink/10 blur-3xl" animate={{ scale: [1.2, 1, 1.2] }} transition={{ duration: 15, repeat: Infinity }} />

        <div className="relative mx-auto grid max-w-7xl items-center gap-8 px-4 pb-12 pt-16 sm:px-6 md:grid-cols-2 lg:gap-10 lg:px-8 lg:pb-20 lg:pt-20">
          <div>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.22em] text-brand-ink shadow-[0_8px_30px_-10px_rgba(0,0,0,0.2)] sm:text-xs"
            >
              <span className="badge-pulse relative h-2 w-2 rounded-full bg-brand-yellow" />
              Book your appointment
            </motion.p>

            <h1 className="font-display mt-4 text-[clamp(2.4rem,8vw,5rem)] leading-[0.92] text-brand-ink sm:mt-5">
              <motion.span initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.7 }} className="block">
                Spa-grade
              </motion.span>
              <motion.span initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45, duration: 0.7 }} className="block">
                grooming<span className="text-white">.</span>
              </motion.span>
              <motion.span
                initial={{ opacity: 0, y: 20, rotate: -3 }}
                animate={{ opacity: 1, y: 0, rotate: -2 }}
                transition={{ delay: 0.65, duration: 0.5 }}
                className="font-accent mt-2 inline-block text-[0.4em] text-brand-ink/80"
              >
                for dogs and cats!
              </motion.span>
            </h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="mt-5 max-w-md text-sm leading-relaxed text-brand-ink/75 sm:text-base"
            >
              Family business dedicated to pet care. Premium products, professional groomers.
              Door-to-door service in Miami-Dade &amp; Broward.
            </motion.p>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.95 }} className="mt-6 flex flex-wrap items-center gap-3">
              <button
                onClick={scrollToForm}
                className="group inline-flex items-center justify-center gap-2 rounded-full bg-brand-ink px-7 py-3.5 text-base font-bold text-white shadow-[0_20px_50px_-15px_rgba(0,0,0,0.5)] transition hover:bg-white hover:text-brand-ink"
              >
                Start booking
                <span className="inline-block transition group-hover:translate-x-1">→</span>
              </button>
              <a
                href="tel:+17869066700"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-7 py-3.5 text-base font-bold text-brand-ink transition hover:bg-brand-ink hover:text-white"
              >
                <Phone size={15} />
                (786) 906-6700
              </a>
            </motion.div>
          </div>
          <motion.div
            initial={{ opacity: 0, scale: 0.9, x: 40 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ duration: 0.9, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="relative order-first md:order-last"
          >
            <div className="absolute -inset-8 -z-10 rounded-full bg-brand-yellow/25 blur-3xl" />
            <div className="animate-floaty">
              <Image
                src="/booking/van-2026.png"
                alt="Urban Mobile Grooming Van"
                width={1400}
                height={1400}
                priority
                className="mx-auto w-full max-w-xs drop-shadow-2xl sm:max-w-md md:max-w-lg"
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── About ── */}
      <section className="px-4 py-16 md:py-24">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-10 md:flex-row">
          <div className="flex-shrink-0">
            <img
              src="/booking/dog-grooming-illustration.png"
              alt="Dog grooming"
              className="h-56 w-56 rounded-2xl object-cover md:h-72 md:w-72"
            />
          </div>
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[#f2c037]">
              Urban Mobile Grooming
            </h3>
            <h2 className="mt-1 text-3xl font-bold text-gray-900">
              We are a mobile pet care company
            </h2>
            <p className="mt-4 text-gray-600">
              Based in Miami, Florida. We offer our human customers the convenience of door-to-door
              service and the assurance that their beloved fur babies are in the safest, most gentle,
              and professional hands. Our fully equipped vans bring the complete grooming experience
              to your home.
            </p>
            <div className="mt-6 flex gap-8">
              <div className="text-center">
                <p className="text-3xl font-bold text-[#0B0B0B]">5+</p>
                <p className="text-xs text-gray-500">Years</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-[#0B0B0B]">1,000+</p>
                <p className="text-xs text-gray-500">Happy Pets</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-[#0B0B0B]">5.0</p>
                <p className="text-xs text-gray-500">Google Rating</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Services ── */}
      <section className="bg-gradient-to-r from-[#FFE16B]/90 to-[#FAB901]/90 px-4 py-16 md:py-24">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-10 text-3xl font-bold text-white">Our Services</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {HERO_SERVICES.map((s) => (
              <button
                key={s.title}
                onClick={scrollToForm}
                className="group overflow-hidden rounded-2xl bg-white shadow-md transition hover:shadow-xl"
              >
                <div className="aspect-square overflow-hidden">
                  <img
                    src={s.img}
                    alt={s.title}
                    className="h-full w-full object-cover transition group-hover:scale-105"
                  />
                </div>
                <div className="p-5 text-left">
                  <h3 className="text-lg font-bold text-gray-900">{s.title}</h3>
                  <p className="mt-1 text-sm text-gray-500">{s.desc}</p>
                  <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-[#0B0B0B]">
                    Book now <ChevronRight size={14} />
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── Dental Section ── */}
      <section className="bg-[#FAB901] px-4 py-12">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-8 md:flex-row">
          <img
            src="/booking/dental-prophylaxis.webp"
            alt="Dental Prophylaxis"
            className="h-64 w-48 rounded-2xl object-cover shadow-lg"
          />
          <div className="text-white/80">
            <h3 className="mb-3 text-xl font-bold text-white">
              Dental Deep Cleaning — $150
            </h3>
            <ul className="space-y-1 text-sm">
              <li>Eliminate bad breath</li>
              <li>Prevent the progression of plaque and tartar</li>
              <li>No anesthesia required — less invasive and safer</li>
              <li>Prevent gum disease and tooth loss</li>
              <li>Perfect for older pets or those with health issues</li>
            </ul>
            <button
              onClick={scrollToForm}
              className="mt-4 rounded-full bg-[#0B0B0B] px-6 py-2 text-sm font-bold text-white transition hover:bg-[#1a1a1a]"
            >
              Book Dental Cleaning
            </button>
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="bg-[#0B0B0B] px-4 py-16 text-white">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-10 text-center text-3xl font-bold">What Our Clients Say</h2>
          <div className="grid gap-6 md:grid-cols-3">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="rounded-2xl bg-white/10 p-6 backdrop-blur">
                <div className="mb-3 flex gap-0.5 text-[#f2c037]">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={16} fill="currentColor" />
                  ))}
                </div>
                <p className="text-sm text-white/80">&ldquo;{t.text}&rdquo;</p>
                <p className="mt-4 text-sm font-semibold text-[#f2c037]">{t.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Service Area ── */}
      <section className="px-4 py-12">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-widest text-[#f2c037]">
            Service Area
          </h2>
          <h3 className="mb-6 text-2xl font-bold text-gray-900">Miami-Dade & Broward County</h3>
          <div className="flex flex-wrap justify-center gap-2">
            {AREAS.map((a) => (
              <span
                key={a}
                className="rounded-full bg-gray-100 px-4 py-1.5 text-sm font-medium text-gray-700"
              >
                {a}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Contact Bar ── */}
      <section className="border-t bg-gray-50 px-4 py-10">
        <div className="mx-auto grid max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <a
            href="tel:+17869066700"
            className="flex items-center gap-3 rounded-xl bg-white p-4 shadow-sm transition hover:shadow-md"
          >
            <Phone size={20} className="text-[#f2c037]" />
            <div>
              <p className="text-xs font-semibold text-gray-400">Phone</p>
              <p className="text-sm font-medium text-gray-900">(786) 906-6700</p>
            </div>
          </a>
          <a
            href="mailto:urbanmobilegrooming@gmail.com"
            className="flex items-center gap-3 rounded-xl bg-white p-4 shadow-sm transition hover:shadow-md"
          >
            <Mail size={20} className="text-[#f2c037]" />
            <div>
              <p className="text-xs font-semibold text-gray-400">Email</p>
              <p className="text-sm font-medium text-gray-900">urbanmobilegrooming@gmail.com</p>
            </div>
          </a>
          <div className="flex items-center gap-3 rounded-xl bg-white p-4 shadow-sm">
            <MapPin size={20} className="text-[#f2c037]" />
            <div>
              <p className="text-xs font-semibold text-gray-400">Location</p>
              <p className="text-sm font-medium text-gray-900">Miami-Dade, FL</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl bg-white p-4 shadow-sm">
            <Clock size={20} className="text-[#f2c037]" />
            <div>
              <p className="text-xs font-semibold text-gray-400">Hours</p>
              <p className="text-sm font-medium text-gray-900">Mon-Sun 8AM - 7PM</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Booking Form ── */}
      <div ref={formRef}>
        {showForm ? (
          <section className="bg-gradient-to-br from-[#0B0B0B] to-[#0B0B0B] px-4 py-16">
            <div className="mx-auto max-w-xl">
              <div className="mb-8 text-center">
                <img
                  src="/logo-urban.png"
                  alt="Urban Mobile Grooming"
                  className="mx-auto h-12 drop-shadow-[0_0_20px_rgba(242,192,55,0.3)]"
                />
                <h2 className="mt-4 text-2xl font-bold text-white">Book Your Appointment</h2>
                <p className="mt-1 text-sm text-white/40">Miami-Dade & Broward County</p>
              </div>
              <BookingFormInner categories={categories} services={services} staff={staff} />
            </div>
          </section>
        ) : (
          <section className="bg-[#f2c037] px-4 py-12 text-center">
            <h3 className="text-2xl font-bold text-[#0B0B0B] md:text-3xl">
              Ready to pamper your pet?
            </h3>
            <p className="mt-2 text-[#0B0B0B]/70">
              Book your mobile grooming appointment today.
            </p>
            <button
              onClick={scrollToForm}
              className="mt-6 rounded-full bg-[#0B0B0B] px-8 py-3 text-lg font-bold text-white transition hover:scale-105 hover:bg-[#1a1a1a]"
            >
              Book Now
            </button>
          </section>
        )}
      </div>

      {/* ── Footer ── */}
      <footer className="bg-gray-900 px-4 py-10 text-center text-xs text-gray-500">
        <p>&copy; {new Date().getFullYear()} Urban Mobile Grooming. All rights reserved.</p>
        <div className="mt-2 flex justify-center gap-4">
          <a
            href="https://www.instagram.com/urbanmobilegrooming/"
            target="_blank"
            rel="noopener"
            className="hover:text-white"
          >
            Instagram
          </a>
          <a
            href="https://www.facebook.com/urbanmobilegrooming/"
            target="_blank"
            rel="noopener"
            className="hover:text-white"
          >
            Facebook
          </a>
        </div>
      </footer>

      {/* ── WhatsApp Floating Button ── */}
      <a
        href="https://wa.me/17869066700"
        target="_blank"
        rel="noopener"
        className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-green-500 text-white shadow-lg transition hover:scale-110 hover:bg-green-600"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" className="h-7 w-7">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
      </a>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Booking Form (multi-step)                                          */
/* ------------------------------------------------------------------ */
function BookingFormInner({
  categories,
  services,
  staff,
}: {
  categories: Category[];
  services: Service[];
  staff: Staff[];
}) {
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    email: "",
    address: "",
    city: "Miami",
    zip: "",
    pet_name: "",
    species: "dog",
    breed: "",
    weight: 30,
    category_id: "",
    service_id: "",
    staff_id: "",
    date: "",
    time: "",
    notes: "",
  });

  const filteredServices = form.category_id
    ? services.filter((s) => s.category_id === form.category_id)
    : services;
  const selectedService = services.find((s) => s.id === form.service_id);

  function canNext(): boolean {
    if (step === 1) return !!form.category_id;
    if (step === 2) return !!form.service_id;
    if (step === 3) return !!form.pet_name && form.weight > 0;
    if (step === 4) return !!form.date && !!form.time;
    if (step === 5) return !!form.first_name && !!form.last_name && !!form.phone;
    return true;
  }

  const [submitError, setSubmitError] = useState<string | null>(null);

  async function handleSubmit() {
    setSaving(true);
    setSubmitError(null);
    try {
      const res = await createPublicBooking({
        first_name: form.first_name,
        last_name: form.last_name,
        phone: form.phone,
        email: form.email || null,
        address: form.address || null,
        city: form.city,
        zip: form.zip || null,
        pet_name: form.pet_name,
        species: form.species,
        breed: form.breed || null,
        weight: form.weight,
        service_id: form.service_id,
        staff_id: form.staff_id || null,
        date: form.date,
        time: form.time,
        notes: form.notes || null,
        price: selectedService?.base_price ?? 0,
      });
      if (res.ok) {
        setSubmitted(true);
      } else {
        setSubmitError(res.error ?? "Something went wrong — please try again");
      }
    } catch (err) {
      console.error(err);
      setSubmitError("Something went wrong — please try again");
    }
    setSaving(false);
  }

  if (submitted) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/5 p-10 text-center backdrop-blur-xl">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/20">
          <Check size={32} className="text-green-400" />
        </div>
        <h2 className="text-2xl font-bold text-white">Booking Confirmed!</h2>
        <p className="mt-2 text-white/50">We&apos;ll contact you to confirm your appointment.</p>
        <div className="mt-6 space-y-1 rounded-xl bg-white/5 p-4 text-left text-sm text-white/60">
          <div className="flex justify-between">
            <span>Service</span>
            <span className="font-medium text-white">{selectedService?.name}</span>
          </div>
          <div className="flex justify-between">
            <span>Pet</span>
            <span className="font-medium text-white">
              {form.pet_name} ({form.breed || form.species})
            </span>
          </div>
          <div className="flex justify-between">
            <span>Date & Time</span>
            <span className="font-medium text-white">
              {form.date} at {form.time}
            </span>
          </div>
          {selectedService && (
            <div className="flex justify-between border-t border-white/10 pt-2">
              <span className="font-bold text-white">Total</span>
              <span className="text-xl font-bold text-[#f2c037]">${selectedService.base_price}</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  const stepLabels = ["Type", "Service", "Pet", "Date", "Info", "Confirm"];
  const inputClass =
    "h-11 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-white outline-none placeholder:text-white/20 focus:border-[#f2c037]/40 focus:bg-white/[0.07]";

  return (
    <div className="rounded-3xl border border-white/[0.08] bg-white/[0.04] p-6 shadow-2xl backdrop-blur-xl sm:p-8">
      {/* Steps indicator */}
      <div className="mb-6 flex items-center justify-between">
        {stepLabels.map((label, i) => (
          <div key={i} className="flex items-center gap-0.5">
            <div
              className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold ${
                step > i + 1
                  ? "bg-green-500 text-white"
                  : step === i + 1
                    ? "bg-[#f2c037] text-[#0B0B0B]"
                    : "bg-white/10 text-white/30"
              }`}
            >
              {step > i + 1 ? <Check size={12} /> : i + 1}
            </div>
            <span
              className={`hidden text-[10px] font-medium sm:inline ${step === i + 1 ? "text-white/70" : "text-white/20"}`}
            >
              {label}
            </span>
            {i < stepLabels.length - 1 && (
              <ChevronRight size={12} className="mx-0.5 text-white/10" />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Category */}
      {step === 1 && (
        <div className="space-y-3">
          <h3 className="text-lg font-bold text-white">What type of service?</h3>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setForm({ ...form, category_id: cat.id, service_id: "" })}
              className={`flex w-full items-center justify-between rounded-xl border-2 p-4 text-left transition-all ${
                form.category_id === cat.id
                  ? "border-[#f2c037] bg-[#f2c037]/5"
                  : "border-white/[0.06] hover:border-white/[0.12]"
              }`}
            >
              <span className="text-sm font-bold text-white">{cat.name}</span>
              <span className="text-xs text-white/30">
                {services.filter((s) => s.category_id === cat.id).length} options
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Step 2: Service */}
      {step === 2 && (
        <div className="space-y-3">
          <h3 className="text-lg font-bold text-white">Choose a Service</h3>
          <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
            {filteredServices.map((svc) => (
              <button
                key={svc.id}
                onClick={() => setForm({ ...form, service_id: svc.id })}
                className={`flex w-full items-center justify-between rounded-xl border-2 p-3 text-left transition-all ${
                  form.service_id === svc.id
                    ? "border-[#f2c037] bg-[#f2c037]/5"
                    : "border-white/[0.06] hover:border-white/[0.12]"
                }`}
              >
                <div>
                  <div className="text-sm font-bold text-white">{svc.name}</div>
                  <div className="text-xs text-white/30">{svc.duration_minutes} min</div>
                </div>
                <div className="text-lg font-bold text-[#f2c037]">${svc.base_price}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 3: Pet info */}
      {step === 3 && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-white">Tell us about your pet</h3>
          <div>
            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-white/30">
              Pet Name *
            </label>
            <input
              value={form.pet_name}
              onChange={(e) => setForm({ ...form, pet_name: e.target.value })}
              className={inputClass}
              placeholder="e.g. Max"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-white/30">
                Species
              </label>
              <div className="flex gap-2">
                {["dog", "cat"].map((s) => (
                  <button
                    key={s}
                    onClick={() => setForm({ ...form, species: s })}
                    className={`flex-1 rounded-xl border-2 p-2.5 text-center text-xs font-bold capitalize transition-all ${
                      form.species === s
                        ? "border-[#f2c037] text-[#f2c037]"
                        : "border-white/10 text-white/30"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-white/30">
                Weight (lbs) *
              </label>
              <input
                type="number"
                value={form.weight}
                onChange={(e) => setForm({ ...form, weight: Number(e.target.value) })}
                className={inputClass}
              />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-white/30">
              Breed
            </label>
            <input
              value={form.breed}
              onChange={(e) => setForm({ ...form, breed: e.target.value })}
              className={inputClass}
              placeholder="e.g. Golden Retriever"
            />
          </div>
          {selectedService && (
            <div className="rounded-xl bg-[#f2c037]/10 p-3 text-center">
              <span className="text-xs text-white/40">Price: </span>
              <span className="text-lg font-bold text-[#f2c037]">${selectedService.base_price}</span>
            </div>
          )}
        </div>
      )}

      {/* Step 4: Date & Time */}
      {step === 4 && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-white">Pick a Date & Time</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-white/30">
                Date *
              </label>
              <input
                type="date"
                min={new Date().toISOString().split("T")[0]}
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className={inputClass}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-white/30">
                Time *
              </label>
              <input
                type="time"
                value={form.time}
                onChange={(e) => setForm({ ...form, time: e.target.value })}
                className={inputClass}
              />
            </div>
          </div>
          {staff.length > 0 && (
            <div>
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-white/30">
                Preferred Groomer (optional)
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setForm({ ...form, staff_id: "" })}
                  className={`flex-1 rounded-xl border-2 p-2.5 text-center text-xs font-bold transition-all ${
                    !form.staff_id
                      ? "border-[#f2c037] text-[#f2c037]"
                      : "border-white/10 text-white/30"
                  }`}
                >
                  Any
                </button>
                {staff.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setForm({ ...form, staff_id: s.id })}
                    className={`flex-1 rounded-xl border-2 p-2.5 text-center text-xs font-bold transition-all ${
                      form.staff_id === s.id
                        ? "border-[#f2c037] text-[#f2c037]"
                        : "border-white/10 text-white/30"
                    }`}
                  >
                    {s.first_name}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div>
            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-white/30">
              Notes
            </label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={3}
              className={`${inputClass} py-3`}
              placeholder="Any special instructions..."
            />
          </div>
        </div>
      )}

      {/* Step 5: Contact info */}
      {step === 5 && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-white">Your Information</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-white/30">
                First Name *
              </label>
              <input
                value={form.first_name}
                onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                className={inputClass}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-white/30">
                Last Name *
              </label>
              <input
                value={form.last_name}
                onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                className={inputClass}
              />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-white/30">
              Phone *
            </label>
            <input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className={inputClass}
              placeholder="(305) 555-0123"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-white/30">
              Email
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-white/30">
              Service Address
            </label>
            <input
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              className={inputClass}
              placeholder="Where should we come?"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-white/30">
                City
              </label>
              <input
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                className={inputClass}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-white/30">
                ZIP
              </label>
              <input
                value={form.zip}
                onChange={(e) => setForm({ ...form, zip: e.target.value })}
                className={inputClass}
              />
            </div>
          </div>
        </div>
      )}

      {/* Step 6: Confirm */}
      {step === 6 && (
        <div className="space-y-3">
          <h3 className="text-lg font-bold text-white">Confirm Your Booking</h3>
          <div className="space-y-2 rounded-xl bg-white/5 p-4 text-sm">
            <div className="flex justify-between">
              <span className="text-white/40">Service</span>
              <span className="font-medium text-white">{selectedService?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/40">Pet</span>
              <span className="font-medium text-white">
                {form.pet_name} ({form.breed || form.species})
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/40">Date & Time</span>
              <span className="font-medium text-white">
                {form.date} at {form.time}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/40">Client</span>
              <span className="font-medium text-white">
                {form.first_name} {form.last_name}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/40">Phone</span>
              <span className="font-medium text-white">{form.phone}</span>
            </div>
            {form.address && (
              <div className="flex justify-between">
                <span className="text-white/40">Address</span>
                <span className="font-medium text-white">
                  {form.address}, {form.city}
                </span>
              </div>
            )}
            {selectedService && (
              <div className="border-t border-white/10 pt-2">
                <div className="flex justify-between">
                  <span className="font-bold text-white">Total</span>
                  <span className="text-xl font-bold text-[#f2c037]">${selectedService.base_price}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="mt-6 flex justify-between">
        <button
          onClick={() => setStep(step - 1)}
          disabled={step === 1}
          className="flex items-center gap-1 rounded-xl px-4 py-2.5 text-sm font-medium text-white/40 transition-colors hover:text-white/60 disabled:opacity-30"
        >
          <ChevronLeft size={16} /> Back
        </button>
        {step < 6 ? (
          <button
            onClick={() => setStep(step + 1)}
            disabled={!canNext()}
            className="flex items-center gap-1 rounded-xl bg-[#f2c037] px-6 py-2.5 text-sm font-bold text-[#0B0B0B] transition-all hover:bg-[#e5a818] disabled:opacity-40"
          >
            Next <ChevronRight size={16} />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex items-center gap-1 rounded-xl bg-[#f2c037] px-6 py-2.5 text-sm font-bold text-[#0B0B0B] transition-all hover:bg-[#e5a818] disabled:opacity-40"
          >
            {saving ? "Booking..." : "Confirm Booking"}
          </button>
        )}
      </div>
      {submitError && (
        <p className="mt-3 text-right text-sm font-semibold text-red-500">{submitError}</p>
      )}
    </div>
  );
}
