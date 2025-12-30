"use client";

import React, { useEffect, useMemo, useState } from "react";
import { ConfigProvider, theme } from "antd";
import type { ThemeConfig } from "antd";
import thTH from "antd/locale/th_TH";
import dayjs from "dayjs";
import "dayjs/locale/th";

dayjs.locale("th");

// --- Modern Color System ---
const BRAND_COLORS = {
  primary: {
    50: "#FFF7ED",
    100: "#FFEDD5",
    200: "#FED7AA",
    300: "#FDBA74",
    400: "#FB923C",
    500: "#F97316",
    600: "#EA580C",
    700: "#C2410C",
    800: "#9A3412",
    900: "#7C2D12",
  },
  midnight: {
    bg: "#0B0F19",
    card: "#111827",
    border: "#1F2937",
  },
} as const;

interface ColorPalette {
  primary: string;
  primaryHover: string;
  primaryActive: string;
  primaryBg: string;
  primaryShadow: string;
  backgroundBase: string;
  backgroundElevated: string;
  backgroundSubtle: string;
  border: string;
  borderLight: string;
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  modalMask: string;
  shadowSoft: string;
  shadowHover: string; // New: Shadow for hover state
}

const getLightPalette = (): ColorPalette => ({
  primary: "#F97316",
  primaryHover: "#FB923C",
  primaryActive: "#EA580C",
  primaryBg: "#FFF7ED",
  primaryShadow: "rgba(249, 115, 22, 0.25)",
  backgroundBase: "#F8FAFC", // Cool gray for modern feel
  backgroundElevated: "#FFFFFF",
  backgroundSubtle: "#F1F5F9",
  border: "#E2E8F0",
  borderLight: "#F1F5F9",
  textPrimary: "#0F172A",
  textSecondary: "#475569",
  textTertiary: "#94A3B8",
  modalMask: "rgba(15, 23, 42, 0.6)",
  shadowSoft:
    "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)",
  shadowHover:
    "0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -2px rgba(0, 0, 0, 0.04)",
});

const getDarkPalette = (): ColorPalette => ({
  primary: "#FB923C",
  primaryHover: "#FDBA74",
  primaryActive: "#F97316",
  primaryBg: "rgba(249, 115, 22, 0.15)",
  primaryShadow: "rgba(251, 146, 60, 0.2)",
  backgroundBase: BRAND_COLORS.midnight.bg,
  backgroundElevated: BRAND_COLORS.midnight.card,
  backgroundSubtle: "#1F2937",
  border: "#374151",
  borderLight: "#1F2937",
  textPrimary: "#F8FAFC",
  textSecondary: "#CBD5E1",
  textTertiary: "#64748B",
  modalMask: "rgba(0, 0, 0, 0.8)",
  shadowSoft: "0 10px 30px -4px rgba(0, 0, 0, 0.5)",
  shadowHover: "0 20px 40px -4px rgba(0, 0, 0, 0.6)",
});

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

const createThemeConfig = (
  isDark: boolean,
  palette: ColorPalette
): ThemeConfig => ({
  algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm,
  token: {
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

    fontFamily:
      '"GoogleSans", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontSize: 14,
    fontWeightStrong: 600,

    borderRadius: 12, // More rounded for modern look
    borderRadiusLG: 16,
    borderRadiusSM: 8,
    borderRadiusXS: 6,

    controlHeight: 44,
    controlHeightLG: 52,
    controlHeightSM: 36,

    boxShadow: palette.shadowSoft,
    boxShadowSecondary: palette.shadowSoft,

    // Animation Global
    motionDurationMid: "0.2s", // Snappier animations
    motionEaseInOut: "cubic-bezier(0.4, 0, 0.2, 1)", // Smooth easing
  },

  components: {
    Layout: {
      headerBg: isDark ? "rgba(17, 24, 39, 0.85)" : "rgba(255, 255, 255, 0.85)", // Glass effect prepared
      bodyBg: palette.backgroundBase,
      siderBg: palette.backgroundElevated,
    },
    Button: {
      controlHeight: 44,
      borderRadius: 12,
      fontWeight: 600,
      defaultBorderColor: "transparent",
      defaultBg: palette.backgroundElevated,
      defaultShadow: "0 2px 5px rgba(0,0,0,0.02)",
      primaryShadow: `0 4px 14px 0 ${palette.primaryShadow}`, // Glow effect
      textHoverBg: palette.backgroundSubtle,
      contentFontSize: 14,
      // Animation
      animationDuration: "0.3s",
    },
    Input: {
      controlHeight: 44,
      borderRadius: 12,
      colorBgContainer: isDark ? "#1F2937" : "#FFFFFF",
      colorBorder: isDark ? "transparent" : "#E2E8F0",
      activeBorderColor: palette.primary,
      hoverBorderColor: isDark ? "#4B5563" : "#94A3B8",
      activeShadow: `0 0 0 4px ${palette.primaryBg}`, // Larger focus ring
      addonBg: palette.backgroundSubtle,
    },
    Select: {
      controlHeight: 44,
      borderRadius: 12,
      colorBgContainer: isDark ? "#1F2937" : "#FFFFFF",
      colorBorder: isDark ? "transparent" : "#E2E8F0",
      selectorBg: isDark ? "#1F2937" : "#FFFFFF",
    },
    Card: {
      borderRadiusLG: 20,
      colorBgContainer: palette.backgroundElevated,
      headerFontSize: 18,
      headerFontWeight: 700,
      boxShadow: palette.shadowSoft,
      boxShadowTertiary: palette.shadowHover, // Can be used for hover effects in custom CSS
      colorBorderSecondary: palette.borderLight,
      paddingLG: 24,
    },
    Table: {
      borderRadiusLG: 16,
      headerBg: "transparent",
      headerColor: palette.textSecondary,
      headerSplitColor: "transparent",
      rowHoverBg: palette.backgroundSubtle,
      borderColor: isDark ? "#374151" : "#F1F5F9",
      headerSortActiveBg: palette.backgroundSubtle,
    },
    Menu: {
      itemBorderRadius: 10,
      itemSelectedBg: palette.primaryBg,
      itemSelectedColor: palette.primary,
      itemActiveBg: palette.backgroundSubtle,
      subMenuItemBg: "transparent",
      itemHeight: 44,
      iconSize: 18,
      // Smooth transition for menu items
      motionDurationSlow: "0.2s",
    },
    Modal: {
      borderRadiusLG: 24,
      headerBg: "transparent",
      contentBg: palette.backgroundElevated,
      boxShadow: isDark
        ? "0 25px 50px -12px rgba(0, 0, 0, 0.5)"
        : "0 25px 50px -12px rgba(0, 0, 0, 0.15)",
      maskBg: palette.modalMask,
    },
    Tag: {
      borderRadiusSM: 8,
      defaultBg: palette.backgroundSubtle,
      defaultColor: palette.textSecondary,
    },
    Tabs: {
      itemSelectedColor: palette.primary,
      inkBarColor: palette.primary,
      itemHoverColor: palette.primaryHover,
      cardBg: palette.backgroundSubtle,
      titleFontSize: 15,
    },
    Segmented: {
      itemSelectedBg: palette.backgroundElevated,
      itemSelectedShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)", // Floating effect
      trackBg: palette.backgroundSubtle,
      borderRadius: 12,
      borderRadiusLG: 12,
      controlHeight: 40,
    },
    Statistic: {
      contentFontSize: 32,
      titleFontSize: 14,
      titleColor: palette.textTertiary,
      fontFamily: '"Inter", sans-serif', // Use number-optimized font
    },
    Typography: {
      fontSizeHeading1: 40,
      fontSizeHeading2: 32,
      fontSizeHeading3: 24,
      fontWeightStrong: 700,
      titleMarginBottom: "0.5em",
    },
    Popover: {
      borderRadius: 16,
      boxShadow: palette.shadowHover,
      colorBgElevated: palette.backgroundElevated,
    },
    Tooltip: {
      borderRadius: 8,
      colorBgSpotlight: isDark ? "#374151" : "#1E293B", // Dark slate for tooltips
    },
    Skeleton: {
      colorFill: isDark ? "#1F2937" : "#F1F5F9",
      colorFillContent: isDark ? "#374151" : "#E2E8F0",
    },
  } as any,
});

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
      componentSize="middle"
      // เปิดใช้ Wave effect และ animation อื่นๆ ของ Antd
      wave={{ disabled: false }}
    >
      {/* เพิ่ม Global CSS Variables สำหรับใช้ใน Custom CSS หรือ Tailwind */}
      <style jsx global>{`
        :root {
          --color-primary: ${palette.primary};
          --color-bg-base: ${palette.backgroundBase};
          --color-bg-card: ${palette.backgroundElevated};
          --shadow-soft: ${palette.shadowSoft};
          --shadow-hover: ${palette.shadowHover};
        }

        /* Smooth Scrolling */
        html {
          scroll-behavior: smooth;
        }

        /* Better Font Rendering */
        body {
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }

        /* Custom Transition for specific elements */
        .ant-btn,
        .ant-input,
        .ant-select-selector,
        .ant-card {
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1) !important;
        }

        /* Card Hover Effect */
        .ant-card:hover {
          transform: translateY(-2px);
          box-shadow: ${palette.shadowHover} !important;
        }
      `}</style>
      {children}
    </ConfigProvider>
  );
}
