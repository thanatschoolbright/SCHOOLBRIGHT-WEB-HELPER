// components/providers/locale-provider.tsx
"use client";

import i18n from "@/i18n";
import { ReactNode, useEffect, useState } from "react";
import { I18nextProvider } from "react-i18next";

interface LocaleProviderProps {
  locale: string;
  children?: ReactNode;
}

export default function LocaleProvider({
  locale,
  children,
}: LocaleProviderProps) {
  const [isI18nInitialized, setIsI18nInitialized] = useState(false);

  useEffect(() => {
    const initI18n = async () => {
      try {
        if (locale && i18n.language !== locale) {
          await i18n.changeLanguage(locale);
        }

        setIsI18nInitialized(true);
      } catch (error) {
        console.error("Failed to initialize i18n:", error);
        setIsI18nInitialized(true); // อนุญาตให้ render ต่อไปแม้เกิดข้อผิดพลาด
      }
    };

    initI18n();
  }, [locale]);

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}
