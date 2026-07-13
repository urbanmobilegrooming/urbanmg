"use client";

// PWA install + notification banners temporarily disabled.
// Service worker still registers (offline/caching) but no UI prompts.

import { useEffect } from "react";

export function ServiceWorkerRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
    // Swallow the install event so the browser's mini-bar stays hidden.
    const handler = (e: Event) => e.preventDefault();
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  return null;
}
