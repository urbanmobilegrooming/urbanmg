import type { Metadata, Viewport } from "next";
import { Inter, Plus_Jakarta_Sans, Barlow, Montserrat, Single_Day } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { ServiceWorkerRegister } from "@/components/pwa/ServiceWorkerRegister";
import { Analytics } from "@/components/landing/Analytics";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
});

const barlow = Barlow({
  variable: "--font-barlow",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

const singleDay = Single_Day({
  variable: "--font-singleday",
  weight: "400",
});

const SITE_URL = "https://urbanmobilegrooming.com";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Urban Mobile Grooming · Mobile Pet Grooming Miami & Broward · We Come to You",
    template: "%s · Urban Mobile Grooming",
  },
  description:
    "Top-rated mobile dog & cat grooming in Miami-Dade and Broward, FL. Door-to-door bath, full grooming and no-anesthesia dental cleaning. 7:30 AM – 7:30 PM, 7 days a week. Book online in 60 seconds.",
  keywords: [
    "mobile pet grooming Miami",
    "mobile dog grooming Broward",
    "dog spa at home Miami",
    "cat grooming Miami-Dade",
    "no anesthesia dental cleaning dogs",
    "pet grooming near me",
    "peluqueria canina movil Miami",
    "baño y corte perro Miami",
    "urban mobile grooming",
    "groomer a domicilio Miami",
    "mobile dog wash Coral Gables",
    "dog grooming Brickell",
    "mobile groomer Fort Lauderdale",
  ],
  authors: [{ name: "Urban Mobile Grooming" }],
  creator: "Urban Mobile Grooming",
  publisher: "Urban Mobile Grooming",
  category: "Pet Services",
  applicationName: "Urban Mobile Grooming",
  manifest: "/manifest.json",
  alternates: {
    canonical: SITE_URL,
    languages: {
      "en-US": SITE_URL,
      "es-US": `${SITE_URL}/es`,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    alternateLocale: "es_US",
    url: SITE_URL,
    siteName: "Urban Mobile Grooming",
    title: "Urban Mobile Grooming — Miami & Broward · We come to you",
    description:
      "Door-to-door dog & cat grooming spa in Miami-Dade and Broward. Bath, full grooming, no-anesthesia dental cleaning. Book today.",
    images: [
      {
        url: "/booking/van-hero.png",
        width: 1200,
        height: 675,
        alt: "Urban Mobile Grooming van — door-to-door pet grooming Miami",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Urban Mobile Grooming — Miami & Broward",
    description:
      "Mobile dog & cat grooming spa. Door-to-door bath, grooming & dental cleaning in Miami-Dade and Broward.",
    images: ["/booking/van-hero.png"],
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Urban Mobile Grooming",
  },
  formatDetection: { telephone: true, address: true, email: true },
  other: {
    "geo.region": "US-FL",
    "geo.placename": "Miami, Florida",
    "geo.position": "25.7617;-80.1918",
    "ICBM": "25.7617, -80.1918",
  },
};

export const viewport: Viewport = {
  themeColor: "#FAB901",
  colorScheme: "light",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${jakarta.variable} ${barlow.variable} ${montserrat.variable} ${singleDay.variable} h-full`}>
      <head>
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body className="h-full antialiased">
        {children}
        <Toaster />
        <ServiceWorkerRegister />
        <Analytics />
      </body>
    </html>
  );
}
