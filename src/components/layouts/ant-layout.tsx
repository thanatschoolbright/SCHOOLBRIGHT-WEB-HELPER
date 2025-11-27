"use client";

import React, { useEffect, useMemo, useState } from "react";
import { ConfigProvider, theme } from "antd";
import type { ThemeConfig } from "antd";
import thTH from "antd/locale/th_TH";
import dayjs from "dayjs";
import "dayjs/locale/th";

dayjs.locale("th");

// --- 1. MODERN COLOR PALETTE ---
// ปรับสีส้มให้สดขึ้น (Electric Orange) และเพิ่ม Neutral Shades ที่ทันสมัย
const BRAND_COLORS = {
  primary: {
    50: "#FFF7ED",
    100: "#FFEDD5",
    200: "#FED7AA",
    300: "#FDBA74",
    400: "#FB923C",
    500: "#F97316", // Main Brand Color
    600: "#EA580C",
    700: "#C2410C",
    800: "#9A3412",
    900: "#7C2D12",
  },
  // สี Dark Mode แบบ Midnight (ไม่ดำสนิท แต่เป็นน้ำเงินเทาลึกๆ)
  midnight: {
    bg: "#0B0F19", // Background หลัก
    card: "#111827", // Card
    border: "#1F2937", // Border
  },
} as const;

interface ColorPalette {
  primary: string;
  primaryHover: string;
  primaryActive: string;
  primaryBg: string; // สีพื้นหลังจางๆ ของ Primary
  primaryShadow: string; // เงาฟุ้งๆ สีเดียวกับแบรนด์
  backgroundBase: string;
  backgroundElevated: string; // พื้นหลัง Card/Modal
  backgroundSubtle: string; // พื้นหลัง Input/Table Header
  border: string;
  borderLight: string;
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  modalMask: string;
  shadowSoft: string; // เงาตกกระทบแบบนุ่ม
}

// --- 2. PALETTE GENERATORS ---

const getLightPalette = (): ColorPalette => ({
  primary: "#F97316", // Vibrant Orange
  primaryHover: "#FB923C",
  primaryActive: "#EA580C",
  primaryBg: "#FFF7ED",
  primaryShadow: "rgba(249, 115, 22, 0.25)", // เงาสีส้มฟุ้ง
  backgroundBase: "#F8F9FB", // ขาวอมเทานิดๆ ดูสะอาดตา (Cool Gray)
  backgroundElevated: "#FFFFFF",
  backgroundSubtle: "#F1F5F9", // Slate-100
  border: "#E2E8F0", // Slate-200
  borderLight: "#F1F5F9",
  textPrimary: "#0F172A", // Slate-900 (เข้มเกือบดำ แต่มีความน้ำเงินนิดๆ)
  textSecondary: "#475569", // Slate-600
  textTertiary: "#94A3B8", // Slate-400
  modalMask: "rgba(15, 23, 42, 0.45)", // Blur backdrop color
  shadowSoft: "0 4px 20px -2px rgba(0, 0, 0, 0.05)",
});

const getDarkPalette = (): ColorPalette => ({
  primary: "#FB923C", // ส้มสว่างขึ้นใน Dark Mode
  primaryHover: "#FDBA74",
  primaryActive: "#F97316",
  primaryBg: "rgba(249, 115, 22, 0.15)",
  primaryShadow: "rgba(251, 146, 60, 0.2)",
  backgroundBase: BRAND_COLORS.midnight.bg, // Midnight Dark
  backgroundElevated: BRAND_COLORS.midnight.card,
  backgroundSubtle: "#1F2937", // Gray-800
  border: "#374151", // Gray-700
  borderLight: "#1F2937",
  textPrimary: "#F8FAFC", // Slate-50
  textSecondary: "#CBD5E1", // Slate-300
  textTertiary: "#64748B", // Slate-500
  modalMask: "rgba(0, 0, 0, 0.75)",
  shadowSoft: "0 10px 30px -4px rgba(0, 0, 0, 0.4)",
});

// --- 3. THEME DETECTOR HOOK ---
const useThemeDetector = (): boolean => {
  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    const updateTheme = () =>
      setIsDark(document.documentElement.classList.contains("dark"));
    const observer = new MutationObserver(updateTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    updateTheme();
    return () => observer.disconnect();
  }, []);
  return isDark;
};

// --- 4. CONFIG CREATOR ---
const createThemeConfig = (
  isDark: boolean,
  palette: ColorPalette
): ThemeConfig => ({
  algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm,
  token: {
    // Colors
    colorPrimary: palette.primary,
    colorPrimaryHover: palette.primaryHover,
    colorPrimaryActive: palette.primaryActive,
    colorPrimaryBg: palette.primaryBg,

    colorText: palette.textPrimary,
    colorTextSecondary: palette.textSecondary,
    colorTextTertiary: palette.textTertiary,

    colorBgBase: palette.backgroundBase,
    colorBgLayout: palette.backgroundBase,
    colorBgContainer: palette.backgroundElevated,
    colorBgElevated: palette.backgroundElevated,

    colorBorder: palette.border,
    colorBorderSecondary: palette.borderLight,

    // Typography (Modern Fonts Stack)
    fontFamily:
      '"LINESeedSansTH", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontSize: 14,
    fontWeightStrong: 600,

    // Radius (More rounded for modern feel)
    borderRadius: 8,
    borderRadiusLG: 12,
    borderRadiusSM: 6,
    borderRadiusXS: 4,

    // Spacing & Height
    controlHeight: 44, // ปุ่มและ Input สูงขึ้นเล็กน้อยเพื่อให้ดู Modern
    controlHeightLG: 52,
    controlHeightSM: 36,

    // Shadows (Custom Soft Shadows)
    boxShadow: palette.shadowSoft,
    boxShadowSecondary: palette.shadowSoft,
  },

  components: {
    Layout: {
      headerBg: isDark ? "rgba(17, 24, 39, 0.8)" : "rgba(255, 255, 255, 0.8)", // Semi-transparent
      bodyBg: palette.backgroundBase,
      siderBg: palette.backgroundElevated,
    },
    Button: {
      controlHeight: 42,
      borderRadius: 10,
      fontWeight: 500,
      defaultBorderColor: "transparent", // No border for default buttons (Surface style)
      defaultBg: palette.backgroundElevated,
      defaultShadow: "0 2px 8px rgba(0,0,0,0.04)", // Subtle shadow instead of border
      primaryShadow: `0 4px 14px 0 ${palette.primaryShadow}`, // Glowing primary button
      textHoverBg: palette.backgroundSubtle,
      contentFontSize: 14,
    },
    Input: {
      controlHeight: 42,
      borderRadius: 10,
      colorBgContainer: isDark ? "#1F2937" : "#F8FAFC", // Filled Input Style
      colorBorder: "transparent", // Remove default border
      activeBorderColor: palette.primary,
      hoverBorderColor: isDark ? "#374151" : "#E2E8F0",
      activeShadow: `0 0 0 2px ${palette.primaryBg}`,
      addonBg: palette.backgroundSubtle,
    },
    Select: {
      controlHeight: 42,
      borderRadius: 10,
      colorBgContainer: isDark ? "#1F2937" : "#F8FAFC",
      colorBorder: "transparent",
      selectorBg: isDark ? "#1F2937" : "#F8FAFC",
    },
    Card: {
      borderRadiusLG: 16,
      colorBgContainer: palette.backgroundElevated,
      headerFontSize: 16,
      headerFontWeight: 600,
      boxShadow: palette.shadowSoft, // Floating Card Effect
      colorBorderSecondary: palette.borderLight,
    },
    Table: {
      borderRadiusLG: 12,
      headerBg: "transparent", // Transparent Header
      headerColor: palette.textSecondary,
      headerSplitColor: "transparent",
      rowHoverBg: palette.backgroundSubtle,
      borderColor: isDark ? "#374151" : "#F1F5F9", // เส้นตารางจางมากๆ
    },
    Menu: {
      itemBorderRadius: 8,
      itemSelectedBg: palette.primaryBg,
      itemSelectedColor: palette.primary,
      itemActiveBg: palette.backgroundSubtle,
      subMenuItemBg: "transparent",
    },
    Modal: {
      borderRadiusLG: 20, // โค้งมากเป็นพิเศษสำหรับ Modal
      headerBg: "transparent",
      contentBg: palette.backgroundElevated,
      boxShadow: isDark
        ? "0 25px 50px -12px rgba(0, 0, 0, 0.5)"
        : "0 25px 50px -12px rgba(0, 0, 0, 0.15)", // Deep Shadow
    },
    Tag: {
      borderRadiusSM: 6,
    },
    Tabs: {
      itemSelectedColor: palette.primary,
      inkBarColor: palette.primary,
      itemHoverColor: palette.primaryHover,
      cardBg: palette.backgroundSubtle,
    },
    Segmented: {
      itemSelectedBg: palette.backgroundElevated,
      itemSelectedShadow: "0 2px 8px rgba(0,0,0,0.08)", // Floating Segment
      trackBg: palette.backgroundSubtle,
      borderRadius: 10,
      borderRadiusLG: 10,
    },
    Statistic: {
      contentFontSize: 26,
      titleFontSize: 13,
      titleColor: palette.textSecondary,
    },
    Typography: {
      fontSizeHeading1: 36,
      fontSizeHeading2: 28,
      fontSizeHeading3: 24,
      fontWeightStrong: 600,
    },
  } as any,
});

// --- 5. THEME PROVIDER COMPONENT ---
export default function AntThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const isDark = useThemeDetector();

  const palette = useMemo(
    () => (isDark ? getDarkPalette() : getLightPalette()),
    [isDark]
  );

  const themeConfig = useMemo(
    () => createThemeConfig(isDark, palette),
    [isDark, palette]
  );

  return (
    <ConfigProvider
      locale={thTH}
      theme={themeConfig}
      // เพิ่ม Global Class สำหรับ Typography เพื่อให้ Font สวยงาม
      componentSize="middle"
    >
      {children}
    </ConfigProvider>
  );
}
