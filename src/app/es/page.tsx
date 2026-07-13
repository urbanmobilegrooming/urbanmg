import type { Metadata } from "next";
import { AnimatedLanding } from "@/components/landing/AnimatedLanding";
import { ES } from "@/components/landing/dict";

const SITE_URL = "https://urbanmobilegrooming.com";

export const metadata: Metadata = {
  title: "Urban Mobile Grooming · Peluquería Canina a Domicilio Miami y Broward",
  description:
    "Grooming móvil para perros y gatos en Miami-Dade y Broward. Baño, corte completo y limpieza dental sin anestesia. A domicilio. 7:30 AM – 7:30 PM, 7 días. Reserva online en 60 segundos.",
  keywords: [
    "peluqueria canina movil Miami",
    "baño y corte perro Miami",
    "groomer a domicilio Miami",
    "grooming perro Miami",
    "limpieza dental perro sin anestesia",
    "groomer movil Broward",
    "estetica canina Miami",
    "spa para perros Miami",
  ],
  alternates: {
    canonical: `${SITE_URL}/es`,
    languages: {
      "en-US": SITE_URL,
      "es-US": `${SITE_URL}/es`,
    },
  },
  openGraph: {
    type: "website",
    locale: "es_US",
    url: `${SITE_URL}/es`,
    siteName: "Urban Mobile Grooming",
    title: "Urban Mobile Grooming — Miami y Broward · Vamos a tu puerta",
    description:
      "Spa móvil de grooming para perros y gatos. Baño, grooming completo y limpieza dental en Miami-Dade y Broward.",
    images: [{ url: "/booking/van-hero.png", width: 1200, height: 675, alt: "Van de Urban Mobile Grooming" }],
  },
};

export default function LandingEs() {
  return <AnimatedLanding dict={ES} />;
}
