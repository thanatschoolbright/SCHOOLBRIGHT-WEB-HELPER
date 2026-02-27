"use client";

import type { ThemeConfig } from "antd";
import { App, ConfigProvider, theme } from "antd";
import thTH from "antd/locale/th_TH";
import dayjs from "dayjs";
import "dayjs/locale/th";
import buddhistEra from "dayjs/plugin/buddhistEra";
import React, { useEffect, useMemo, useState } from "react";
import { FontProvider, useFont } from "../providers/font-provider";

dayjs.extend(buddhistEra);
dayjs.locale("th");

type FontFamily = "google-sans" | "sukhumvit";

const BRAND_COLORS = {
  primary: "#FF8C00",
  success: "#10B981",
  warning: "#F59E0B",
  error: "#EF4444",
  info: "#3B82F6",
};

const FONTS: Record<FontFamily, string> = {
  "google-sans": 'var(--font-google-sans), "Google Sans", sans-serif',
  sukhumvit: 'var(--font-sukhumvit), "Sukhumvit Set", sans-serif',
};

const SYSTEM_PALETTE = {
  light: {
    bgLayout: "#FAFAFA",
    bgContainer: "#FFFFFF",
    textMain: "#09090B",
    textSub: "#71717A",
    border: "#E4E4E7",
  },
  dark: {
    bgLayout: "#09090B",
    bgContainer: "#18181B",
    textMain: "#FAFAFA",
    textSub: "#A1A1AA",
    border: "#27272A",
  },
};

const useDarkModeDetector = (): boolean => {
  const [isDark, setIsDark] = useState<boolean>(false);

  useEffect(() => {
    const updateTheme = () => {
      setIsDark(document.documentElement.classList.contains("dark"));
    };

    updateTheme();

    const observer = new MutationObserver(updateTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  return isDark;
};

const getModernAntTheme = (isDark: boolean, font: FontFamily): ThemeConfig => {
  const palette = isDark ? SYSTEM_PALETTE.dark : SYSTEM_PALETTE.light;
  const currentFontFamily = FONTS[font] || FONTS["google-sans"];

  return {
    algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm,
    token: {
      colorPrimary: BRAND_COLORS.primary,
      colorSuccess: BRAND_COLORS.success,
      colorWarning: BRAND_COLORS.warning,
      colorError: BRAND_COLORS.error,
      colorInfo: BRAND_COLORS.info,
      colorBgBase: palette.bgLayout,
      colorBgLayout: palette.bgLayout,
      colorBgContainer: palette.bgContainer,
      colorBgElevated: isDark ? "#27272A" : "#FFFFFF",
      colorTextBase: palette.textMain,
      colorTextSecondary: palette.textSub,
      colorBorder: palette.border,
      colorBorderSecondary: palette.border,
      fontFamily: currentFontFamily,
      fontSize: 14,
      borderRadius: 12,
      borderRadiusLG: 16,
      controlHeight: 40,
      wireframe: false,
      boxShadow: isDark
        ? "0 4px 20px -2px rgba(0, 0, 0, 0.5)"
        : "0 4px 20px -2px rgba(0, 0, 0, 0.05)",
    },
    components: {
      Button: { controlOutline: "none", fontWeight: 500, paddingInline: 24 },
      Card: { paddingLG: 24 },
      Table: {
        headerBg: isDark ? "#18181B" : "#F4F4F5",
        headerSplitColor: "transparent",
        headerBorderRadius: 12,
        borderColor: palette.border,
      },
      Modal: { paddingLG: 24 },
      Layout: {
        headerBg: isDark ? "rgba(9, 9, 9, 0.7)" : "rgba(255, 255, 255, 0.7)",
        headerPadding: "0 24px",
      },
      Menu: { itemBorderRadius: 8, activeBarBorderWidth: 0 },
    },
  };
};

function AntDesignThemeInner({ children }: { children: React.ReactNode }) {
  const isDark = useDarkModeDetector();
  const { fontFamily } = useFont();

  // 🟢 1. สร้าง mounted state ป้องกัน Hydration Mismatch
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const safeFontFamily = (fontFamily as FontFamily) || "google-sans";
  const themeConfig = useMemo(
    () => getModernAntTheme(isDark, safeFontFamily),
    [isDark, safeFontFamily],
  );

  const activePalette = isDark ? SYSTEM_PALETTE.dark : SYSTEM_PALETTE.light;
  const cssFontFamily = FONTS[safeFontFamily];

  // 🟢 2. ระหว่างที่ Server กำลัง Render ให้ return โครงเปล่าๆ (หรือ UI กลางๆ) ป้องกัน Error
  // (วิธีนี้คือ Best Practice ของ Next.js ในการจัดการ Theme Provider)
  if (!mounted) {
    return <div style={{ visibility: "hidden" }}>{children}</div>;
  }

  return (
    <ConfigProvider
      locale={thTH}
      theme={themeConfig}
      componentSize="middle"
      input={{ autoComplete: "off" }}
    >
      <App>
        {/* 🟢 3. ปรับการส่งค่าสีเข้าไปเป็น CSS Variables เพื่อ Performance ที่ดีขึ้น */}
        <div
          style={
            {
              "--bg-layout": activePalette.bgLayout,
              "--text-main": activePalette.textMain,
              "--border-color": activePalette.border,
              "--scroll-thumb": isDark ? "#3F3F46" : "#D4D4D8",
              "--scroll-thumb-hover": isDark ? "#52525B" : "#A1A1AA",
              "--card-shadow": isDark
                ? "0 12px 30px -10px rgba(0, 0, 0, 0.8)"
                : "0 12px 30px -10px rgba(9, 9, 11, 0.1)",
            } as React.CSSProperties
          }
          className="ant-theme-wrapper"
        >
          <style jsx global>{`
            :root {
              --font-family-current: ${cssFontFamily};
            }
            body {
              background-color: var(--bg-layout);
              color: var(--text-main);
              font-family: var(--font-family-current);
              -webkit-font-smoothing: antialiased;
              -moz-osx-font-smoothing: grayscale;
              transition:
                background-color 0.3s ease,
                color 0.3s ease;
            }
            ::-webkit-scrollbar {
              width: 8px;
              height: 8px;
            }
            ::-webkit-scrollbar-track {
              background: transparent;
            }
            ::-webkit-scrollbar-thumb {
              background: var(--scroll-thumb);
              border-radius: 999px;
              border: 2px solid var(--bg-layout);
            }
            ::-webkit-scrollbar-thumb:hover {
              background: var(--scroll-thumb-hover);
            }
            .ant-card {
              transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            }
            .ant-card:hover {
              transform: translateY(-2px);
              box-shadow: var(--card-shadow);
            }
            .ant-table-wrapper .ant-table-container {
              border: 1px solid var(--border-color);
              border-radius: 12px;
              overflow: hidden;
            }
            .ant-layout-header {
              backdrop-filter: blur(16px);
              -webkit-backdrop-filter: blur(16px);
              position: sticky;
              top: 0;
              z-index: 50;
              border-bottom: 1px solid var(--border-color);
            }
          `}</style>
          {children}
        </div>
      </App>
    </ConfigProvider>
  );
}

export default function AntDesignThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <FontProvider>
      <AntDesignThemeInner>{children}</AntDesignThemeInner>
    </FontProvider>
  );
}
