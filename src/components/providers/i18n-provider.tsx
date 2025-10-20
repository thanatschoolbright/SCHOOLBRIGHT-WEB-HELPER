// components/providers/locale-provider.tsx
"use client";

import { useEffect, useState, ReactNode } from "react";
import { I18nextProvider } from "react-i18next";
import i18n from "@/i18n";

interface LocaleProviderProps {
    locale: string;
    children?: ReactNode;
}

export default function LocaleProvider({ locale, children }: LocaleProviderProps) {
    const [isI18nInitialized, setIsI18nInitialized] = useState(false);

    useEffect(() => {
        const initI18n = async () => {
            try {
                // เปลี่ยน locale ถ้าต้องการ
                if (locale && i18n.language !== locale) {
                    await i18n.changeLanguage(locale);
                }
                
                // เซ็ต localStorage
                if (locale) {
                    localStorage.setItem("appLocale", locale);
                }
                
                setIsI18nInitialized(true);
            } catch (error) {
                console.error("Failed to initialize i18n:", error);
                setIsI18nInitialized(true); // อนุญาตให้ render ต่อไปแม้เกิดข้อผิดพลาด
            }
        };

        initI18n();
    }, [locale]);

    // แสดง loading หรือ fallback ระหว่างรอ i18n initialize
    if (!isI18nInitialized) {
        return (
            <div style={{ 
                display: "flex", 
                justifyContent: "center", 
                alignItems: "center", 
                height: "100vh",
                fontSize: "16px",
                color: "#666"
            }}>
                Loading...
            </div>
        );
    }

    return (
        <I18nextProvider i18n={i18n}>
            {children}
        </I18nextProvider>
    );
}
