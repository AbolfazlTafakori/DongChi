"use client";

import { useEffect } from "react";

export function PwaRegistrar() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const isLocalhost =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1" ||
      window.location.hostname.endsWith(".local");

    // On localhost / development, ALWAYS unregister any existing Service Worker
    // and purge window.caches to prevent poisoned or stale CSS/JS cache.
    if (isLocalhost || process.env.NODE_ENV !== "production") {
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.getRegistrations().then((registrations) => {
          for (const registration of registrations) {
            registration.unregister().then((success) => {
              if (success) {
                console.log("[PWA] Development mode: Unregistered Service Worker successfully.");
              }
            });
          }
        });
      }

      if ("caches" in window) {
        caches.keys().then((keys) => {
          for (const key of keys) {
            caches.delete(key).then(() => {
              console.log("[PWA] Development mode: Purged cache key:", key);
            });
          }
        });
      }

      return;
    }

    // Only register in actual non-localhost production environments
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log("DongChi ServiceWorker registered: ", registration.scope);
        })
        .catch((error) => {
          console.error("DongChi ServiceWorker registration failed: ", error);
        });
    }
  }, []);

  return null;
}
