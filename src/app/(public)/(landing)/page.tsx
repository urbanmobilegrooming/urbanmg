import { AnimatedLanding } from "@/components/landing/AnimatedLanding";
import { EN } from "@/components/landing/dict";

const SITE_URL = "https://urbanmobilegrooming.com";
const PHONE = "+1-786-906-6700";
const EMAIL = "urbanmobilegrooming@gmail.com";

const REVIEWS = [
  { name: "Sender Ospina", text: "Excelente atención mi Bella quedó espectacular. El grooming Daniel hace muy bien su trabajo." },
  { name: "Raquel Valiente", text: "Mi primera vez haciendo un grooming a domicilio y la verdad es mucho más cómodo. Muy amable." },
  { name: "Vero V.", text: "Mi mascota Prince, un Teckel, le encanta el servicio que ustedes brindan." },
  { name: "Sandra Nieto", text: "Realmente me gusta como hacen su trabajo, a mi Greco lo dejan siempre espectacular." },
  { name: "Glenda Belliard", text: "Por más de 14 meses, cada 15 días me bañan a mi príncipe y hacen un excelente trabajo." },
  { name: "Ashley Hernández", text: "Me encantó el servicio desde la atención hasta el resultado de mis perritos." },
  { name: "Monika H. McCormick", text: "Excelente servicio. Llegaron a tiempo, Ernesto fue muy amable e hizo un increíble trabajo." },
  { name: "César M.", text: "Los busqué por primera vez en Instagram y me atendieron al momento el mismo día." },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": ["PetStore", "LocalBusiness"],
      "@id": `${SITE_URL}/#business`,
      name: "Urban Mobile Grooming",
      alternateName: "Urban Mobile Grooming Miami",
      url: SITE_URL,
      logo: `${SITE_URL}/logo-urban.png`,
      image: [`${SITE_URL}/booking/van-hero.png`],
      description:
        "Mobile pet grooming company serving Miami-Dade and Broward — bath, full grooming, no-anesthesia dental cleaning for dogs and cats. Door-to-door service.",
      telephone: PHONE,
      email: EMAIL,
      priceRange: "$$",
      currenciesAccepted: "USD",
      paymentAccepted: "Cash, Credit Card, Debit Card, Zelle, Venmo",
      areaServed: [
        { "@type": "City", name: "Miami" },
        { "@type": "City", name: "Miami Beach" },
        { "@type": "City", name: "Coral Gables" },
        { "@type": "City", name: "Brickell" },
        { "@type": "City", name: "Pinecrest" },
        { "@type": "City", name: "Kendall" },
        { "@type": "City", name: "Doral" },
        { "@type": "City", name: "Key Biscayne" },
        { "@type": "City", name: "Aventura" },
        { "@type": "City", name: "Cutler Bay" },
        { "@type": "City", name: "Homestead" },
        { "@type": "City", name: "Fort Lauderdale" },
        { "@type": "City", name: "Hollywood" },
        { "@type": "City", name: "Pembroke Pines" },
        { "@type": "AdministrativeArea", name: "Miami-Dade County" },
        { "@type": "AdministrativeArea", name: "Broward County" },
      ],
      address: {
        "@type": "PostalAddress",
        addressLocality: "Miami",
        addressRegion: "FL",
        addressCountry: "US",
      },
      geo: { "@type": "GeoCoordinates", latitude: 25.7617, longitude: -80.1918 },
      openingHoursSpecification: [
        {
          "@type": "OpeningHoursSpecification",
          dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
          opens: "07:30",
          closes: "19:30",
        },
      ],
      sameAs: [
        "https://www.instagram.com/urbanmobilegrooming/",
        "https://www.facebook.com/urbanmobilegrooming/",
      ],
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: "5.0",
        reviewCount: "252",
        bestRating: "5",
        worstRating: "5",
      },
      review: REVIEWS.map((r) => ({
        "@type": "Review",
        reviewRating: { "@type": "Rating", ratingValue: "5", bestRating: "5" },
        author: { "@type": "Person", name: r.name },
        reviewBody: r.text,
      })),
      hasOfferCatalog: {
        "@type": "OfferCatalog",
        name: "Grooming services",
        itemListElement: [
          {
            "@type": "Offer",
            itemOffered: {
              "@type": "Service",
              name: "Bath",
              description:
                "Shampoo, conditioner, anal gland, ear cleaning, hair dryer, nail cut & grinding, sanitary trim, cologne.",
            },
          },
          {
            "@type": "Offer",
            itemOffered: {
              "@type": "Service",
              name: "Full Grooming",
              description: "Bath service plus teeth brush and a full breed-standard haircut.",
            },
          },
          {
            "@type": "Offer",
            itemOffered: {
              "@type": "Service",
              name: "Dental Cleaning",
              description: "Professional no-anesthesia dental prophylaxis. Removes tartar and plaque.",
            },
          },
        ],
      },
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: "Urban Mobile Grooming",
      inLanguage: "en-US",
      publisher: { "@id": `${SITE_URL}/#business` },
      potentialAction: {
        "@type": "SearchAction",
        target: { "@type": "EntryPoint", urlTemplate: `${SITE_URL}/?q={search_term_string}` },
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#org`,
      name: "Urban Mobile Grooming",
      url: SITE_URL,
      logo: `${SITE_URL}/logo-urban.png`,
      contactPoint: [
        {
          "@type": "ContactPoint",
          telephone: PHONE,
          email: EMAIL,
          contactType: "customer service",
          areaServed: "US-FL",
          availableLanguage: ["English", "Spanish"],
        },
      ],
      sameAs: [
        "https://www.instagram.com/urbanmobilegrooming/",
        "https://www.facebook.com/urbanmobilegrooming/",
      ],
    },
    {
      "@type": "FAQPage",
      "@id": `${SITE_URL}/#faq`,
      mainEntity: [
        {
          "@type": "Question",
          name: "How does mobile grooming work?",
          acceptedAnswer: {
            "@type": "Answer",
            text:
              "We bring a fully self-contained grooming van to your home. It has its own water, power, climate control, and a professional grooming station. We park in your driveway and groom your pet right outside while you stay inside.",
          },
        },
        {
          "@type": "Question",
          name: "Do I need to be home during the appointment?",
          acceptedAnswer: {
            "@type": "Answer",
            text:
              "Not necessarily. Many clients let us in to pick up the pet and continue with their day. We'll text you when we arrive and when your pet is ready.",
          },
        },
        {
          "@type": "Question",
          name: "How long does a session take?",
          acceptedAnswer: {
            "@type": "Answer",
            text:
              "Most full grooms take 60–90 minutes depending on coat condition and size. Bath & brush sessions are usually 45–60 minutes.",
          },
        },
        {
          "@type": "Question",
          name: "What products do you use?",
          acceptedAnswer: {
            "@type": "Answer",
            text:
              "All-natural, hypoallergenic shampoos and conditioners. We carry options for sensitive skin, anti-itch, deshedding, and whitening.",
          },
        },
        {
          "@type": "Question",
          name: "Do you serve all of South Florida?",
          acceptedAnswer: {
            "@type": "Answer",
            text:
              "We cover Miami-Dade and Broward counties. From Brickell to Homestead, Fort Lauderdale to Hollywood. Call us to confirm your zip code.",
          },
        },
      ],
    },
  ],
};

export default function LandingPage() {
  return (
    <>
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <AnimatedLanding dict={EN} />
    </>
  );
}
