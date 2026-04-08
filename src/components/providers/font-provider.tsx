"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export type FontFamily =
  | "google-sans"
  | "sukhumvit"
  | "anuphan"
  | "kanit"
  | "line-seed";

// CSS variable ของแต่ละ font
export const FONT_CSS_VAR: Record<FontFamily, string> = {
  "google-sans": "var(--font-google-sans), sans-serif",
  "sukhumvit": "var(--font-sukhumvit), sans-serif",
  "anuphan": "var(--font-anuphan), sans-serif",
  "kanit": "var(--font-kanit), sans-serif",
  "line-seed": "var(--font-line-seed), sans-serif",
};

const VALID_FONTS: FontFamily[] = [
  "google-sans",
  "sukhumvit",
  "anuphan",
  "kanit",
  "line-seed",
];

interface FontContextType {
  fontFamily: FontFamily;
  setFontFamily: (font: FontFamily) => void;
}

const FontContext = createContext<FontContextType | undefined>(undefined);

export function FontProvider({ children }: { children: React.ReactNode }) {
  // ค่าเริ่มต้น: Anuphan (ฟอนต์ไทยสวยและ modern ที่สุด)
  const [fontFamily, setFontFamilyState] = useState<FontFamily>("anuphan");

  // โหลด font ที่บันทึกไว้จาก localStorage
  useEffect(() => {
    const saved = localStorage.getItem("app-font-family") as FontFamily;
    if (saved && VALID_FONTS.includes(saved)) {
      setFontFamilyState(saved);
    }
  }, []);

  // บันทึก font เมื่อเปลี่ยนแปลง
  const setFontFamily = (font: FontFamily) => {
    setFontFamilyState(font);
    localStorage.setItem("app-font-family", font);
  };

  return (
    <FontContext.Provider value={{ fontFamily, setFontFamily }}>
      <div
        style={{ fontFamily: FONT_CSS_VAR[fontFamily] }}
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
