// components/ClientProvider.tsx
"use client"; // This ensures the file is treated as a Client Component

import { StoreProvider } from "@stores/store-provider";
import { useEffect, useState } from "react";
import { registerServiceWorker } from "@services/progressive-web-app";

export default function ClientProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [hydrated, setHydrated] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // Register Service Worker for PWA
  useEffect(() => {
    registerServiceWorker();
  }, []);

  // Hydration to avoid SSR mismatch
  useEffect(() => {
    setHydrated(true);
  }, []);

  if (!hydrated) {
    return null;
  }

  return <StoreProvider>{children}</StoreProvider>;
}
