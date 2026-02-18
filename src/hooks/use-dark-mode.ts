"use client";

import { useEffect, useState } from "react";

const DARK_MODE_KEY = "theme";

export default function useDarkMode() {
  const [isDark, setIsDark] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedDarkMode = localStorage.getItem(DARK_MODE_KEY);
      if (savedDarkMode !== null) {
        setIsDark(savedDarkMode === "dark");
      } else {
        const prefersDarkMode = window.matchMedia(
          "(prefers-color-scheme: dark)",
        ).matches;
        setIsDark(prefersDarkMode);
      }
      setIsInitialized(true);
    }
  }, []);

  useEffect(() => {
    if (!isInitialized) return;

    const root = window.document.documentElement;
    if (isDark) {
      root.classList.add("dark");
      localStorage.setItem(DARK_MODE_KEY, "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem(DARK_MODE_KEY, "light");
    }
  }, [isDark, isInitialized]);

  return { isDark, setIsDark };
}
