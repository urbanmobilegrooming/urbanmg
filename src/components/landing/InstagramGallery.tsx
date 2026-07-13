"use client";

import { useEffect } from "react";
import Image from "next/image";

// Behold.so feed widget — get yours at https://behold.so
// After connecting Instagram, paste the Feed ID below (e.g. "abc123xyz").
const BEHOLD_FEED_ID = process.env.NEXT_PUBLIC_BEHOLD_FEED_ID ?? "";

// Fallback: 6 hardcoded posts from @urbanmobilegrooming with native IG embeds
const FALLBACK_POSTS = [
  "https://www.instagram.com/p/DDKDx8jO7Le/",
  "https://www.instagram.com/p/DCpiFI9B_mL/",
  "https://www.instagram.com/p/DCe_jfEBdSK/",
  "https://www.instagram.com/p/DCZk0iLPfXy/",
  "https://www.instagram.com/p/DC6sOAtuKMs/",
  "https://www.instagram.com/p/DC0SPwQO6wt/",
];

declare global {
  interface Window {
    instgrm?: { Embeds: { process: () => void } };
  }
  namespace JSX {
    interface IntrinsicElements {
      "behold-widget": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & { "feed-id": string },
        HTMLElement
      >;
    }
  }
}

export function InstagramGallery() {
  useEffect(() => {
    if (BEHOLD_FEED_ID) {
      // Load Behold script
      const ID = "behold-widget-script";
      if (!document.getElementById(ID)) {
        const s = document.createElement("script");
        s.id = ID;
        s.src = "https://w.behold.so/widget.js";
        s.type = "module";
        document.body.appendChild(s);
      }
      return;
    }
    // Fallback: process IG embed.js
    const ID = "instagram-embed-script";
    const process = () => window.instgrm?.Embeds.process();
    if (!document.getElementById(ID)) {
      const s = document.createElement("script");
      s.id = ID;
      s.async = true;
      s.src = "https://www.instagram.com/embed.js";
      s.onload = process;
      document.body.appendChild(s);
    } else {
      process();
    }
  }, []);

  // 1. Behold widget (auto-updating grid)
  if (BEHOLD_FEED_ID) {
    return (
      <div className="overflow-hidden rounded-3xl bg-white p-4">
        {/* @ts-expect-error custom element */}
        <behold-widget feed-id={BEHOLD_FEED_ID} />
      </div>
    );
  }

  // 2. Fallback: native IG embeds
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
      {FALLBACK_POSTS.map((url) => (
        <blockquote
          key={url}
          className="instagram-media"
          data-instgrm-permalink={url}
          data-instgrm-version="14"
          style={{ background: "#fff", border: 0, margin: 0, maxWidth: "540px", minWidth: "280px", padding: 0, width: "100%" }}
        />
      ))}
    </div>
  );
}

// Static fallback grid (no JS needed) — pre-renders local images while IG loads
export function InstagramFallbackGrid() {
  const items = [
    "/booking/urban-bano-1.jpg",
    "/booking/urban-bano-2.jpg",
    "/booking/urban-bano-3.jpg",
    "/booking/gallery-1.jpg",
    "/booking/gallery-2.jpg",
    "/booking/gallery-3-chanel.png",
  ];
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:gap-4">
      {items.map((src, i) => (
        <a
          key={i}
          href="https://www.instagram.com/urbanmobilegrooming/"
          target="_blank"
          rel="noopener"
          className="group relative aspect-square overflow-hidden rounded-2xl bg-white"
        >
          <Image src={src} alt={`Post ${i + 1}`} fill className="object-cover transition duration-700 group-hover:scale-110" sizes="(max-width: 768px) 50vw, 33vw" />
          <div className="absolute inset-0 flex items-end justify-end bg-gradient-to-t from-black/40 to-transparent opacity-0 transition group-hover:opacity-100">
            <div className="m-3 rounded-full bg-white p-2 shadow-lg">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-brand-ink">
                <path d="M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41a3.7 3.7 0 01-1.38-.9 3.7 3.7 0 01-.9-1.38c-.16-.42-.36-1.06-.41-2.23-.06-1.27-.07-1.65-.07-4.85s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41 1.27-.06 1.65-.07 4.85-.07M12 0C8.74 0 8.33.01 7.05.07 5.78.13 4.9.33 4.14.63a5.86 5.86 0 00-2.13 1.38A5.86 5.86 0 00.63 4.14C.33 4.9.13 5.78.07 7.05.01 8.33 0 8.74 0 12s.01 3.67.07 4.95c.06 1.27.26 2.15.56 2.91.31.79.73 1.46 1.38 2.13a5.86 5.86 0 002.13 1.38c.76.3 1.64.5 2.91.56C8.33 23.99 8.74 24 12 24s3.67-.01 4.95-.07c1.27-.06 2.15-.26 2.91-.56a5.86 5.86 0 002.13-1.38 5.86 5.86 0 001.38-2.13c.3-.76.5-1.64.56-2.91.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95c-.06-1.27-.26-2.15-.56-2.91A5.86 5.86 0 0021.99 2 5.86 5.86 0 0019.86.63c-.76-.3-1.64-.5-2.91-.56C15.67.01 15.26 0 12 0Zm0 5.84a6.16 6.16 0 100 12.32A6.16 6.16 0 0012 5.84Zm0 10.16a4 4 0 110-8 4 4 0 010 8Zm7.85-10.4a1.44 1.44 0 11-2.88 0 1.44 1.44 0 012.88 0Z"/>
              </svg>
            </div>
          </div>
        </a>
      ))}
    </div>
  );
}
