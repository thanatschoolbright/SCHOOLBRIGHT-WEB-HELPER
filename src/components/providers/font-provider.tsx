"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

type FontFamily = "google-sans" | "sukhumvit";

interface FontContextType {
  fontFamily: FontFamily;
  setFontFamily: (font: FontFamily) => void;
}

const FontContext = createContext<FontContextType | undefined>(undefined);

export function FontProvider({ children }: { children: React.ReactNode }) {
  const [fontFamily, setFontFamilyState] = useState<FontFamily>("google-sans");
  const [isInitialized, setIsInitialized] = useState(false);

  // Load saved font from localStorage on mount
  useEffect(() => {
    const savedFont = localStorage.getItem("app-font-family") as FontFamily;
    if (
      savedFont &&
      (savedFont === "google-sans" || savedFont === "sukhumvit")
    ) {
      setFontFamilyState(savedFont);
    }
    setIsInitialized(true);
  }, []);

  // Save font to localStorage when it changes
  const setFontFamily = (font: FontFamily) => {
    setFontFamilyState(font);
    localStorage.setItem("app-font-family", font);
  };

  return (
    <FontContext.Provider value={{ fontFamily, setFontFamily }}>
      <div
        style={{
          fontFamily:
            fontFamily === "google-sans"
              ? "var(--font-google-sans), sans-serif"
              : "var(--font-sukhumvit), sans-serif",
        }}
        className="h-full w-full"
      >
        {children}
      </div>
    </FontContext.Provider>
  );
}

export const useFont = () => {
  const context = useContext(FontContext);
  if (context === undefined) {
    throw new Error("useFont must be used within a FontProvider");
  }
  return context;
};
