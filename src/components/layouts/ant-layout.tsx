"use client";

import React, { useEffect, useMemo, useState } from "react";
import { ConfigProvider, theme } from "antd";
import type { ThemeConfig } from "antd";
import thTH from "antd/locale/th_TH";
import dayjs from "dayjs";
import "dayjs/locale/th";

dayjs.locale("th");

// --- Modern & Balanced Color Palette (Orange Primary) ---
const BRAND_TOKENS = {
  primary: "#F97316", // Vibrant Orange (Tailwind Orange-500)
  primaryHover: "#FB923C", // Lighter for hover
  primaryActive: "#EA580C", // Darker for active
  primaryShadow: "rgba(249, 115, 22, 0.25)",
  success: "#10B981", // Emerald-500
  warning: "#F59E0B", // Amber-500
  error: "#EF4444", // Red-500
  info: "#3B82F6", // Blue-500
};

const SYSTEM_COLORS = {
  light: {
    bgBase: "#FFFFFF", // Clean White
    bgLayout: "#F8FAFC", // Slate-50 (Very subtle grey for background)
    bgContainer: "#FFFFFF",
    bgElevated: "#FFFFFF",
    textMain: "#0F172A", // Slate-900 (High contrast)
    textSub: "#64748B", // Slate-500 (Readable secondary)
    textPlaceholder: "#94A3B8",
    border: "#E2E8F0", // Slate-200
    shadowSm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
    shadowMd:
      "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
    shadowLg:
      "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
  },
  dark: {
    bgBase: "#0B0F19", // Deep Blue-Black
    bgLayout: "#111827", // Gray-900
    bgContainer: "#1F2937", // Gray-800
    bgElevated: "#1F2937",
    textMain: "#F1F5F9", // Slate-100
    textSub: "#94A3B8", // Slate-400
    textPlaceholder: "#475569",
    border: "#374151", // Gray-700
    shadowSm: "0 1px 2px 0 rgba(0, 0, 0, 0.3)",
    shadowMd: "0 4px 6px -1px rgba(0, 0, 0, 0.4)",
    shadowLg: "0 10px 15px -3px rgba(0, 0, 0, 0.5)",
  },
};

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

const createThemeConfig = (isDark: boolean): ThemeConfig => {
  const colors = isDark ? SYSTEM_COLORS.dark : SYSTEM_COLORS.light;

  return {
    algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm,
    token: {
      // --- Colors ---
      colorPrimary: BRAND_TOKENS.primary,
      colorInfo: BRAND_TOKENS.info,
      colorSuccess: BRAND_TOKENS.success,
      colorWarning: BRAND_TOKENS.warning,
      colorError: BRAND_TOKENS.error,

      colorBgBase: colors.bgBase,
      colorBgLayout: colors.bgLayout,
      colorBgContainer: colors.bgContainer,
      colorBgElevated: colors.bgElevated,

      colorTextBase: colors.textMain,
      colorTextSecondary: colors.textSub,
      colorTextPlaceholder: colors.textPlaceholder,

      colorBorder: colors.border,
      colorBorderSecondary: isDark ? "#4B5563" : "#F1F5F9",

      // --- Typography (Balanced & Modern) ---
      fontFamily:
        '"Kanit", -apple-system, BlinkMacSystemFont, "Segoe UI", "Inter", Roboto, sans-serif',
      fontSize: 14,
      lineHeight: 1.6,
      lineHeightHeading1: 1.3,
      lineHeightHeading2: 1.35,
      lineHeightHeading3: 1.4,
      lineHeightHeading4: 1.45,
      lineHeightHeading5: 1.5,
      fontSizeHeading1: 32,
      fontSizeHeading2: 28,
      fontSizeHeading3: 24,
      fontSizeHeading4: 20,
      fontSizeHeading5: 18,

      // --- Shape & Dimension (Sleek & Compact) ---
      borderRadius: 8,
      borderRadiusLG: 12,
      borderRadiusSM: 4,

      // Balanced Heights (More spacious for readability)
      controlHeight: 40,
      controlHeightLG: 48,
      controlHeightSM: 32,

      // Spacing (Better breathing room)
      paddingContentHorizontal: 20,
      marginXS: 8,
      marginSM: 16,
      margin: 20,

      wireframe: false,
    },
    components: {
      Button: {
        controlHeight: 40,
        borderRadius: 8,
        fontWeight: 500,
        contentFontSize: 14,
        paddingInline: 18,
        paddingBlock: 8,
        lineHeight: 1.5,
        primaryShadow: isDark ? "none" : BRAND_TOKENS.primaryShadow,
        defaultShadow: isDark ? "none" : colors.shadowSm,
        defaultBorderColor: colors.border,
      },
      Card: {
        borderRadiusLG: 16,
        paddingLG: 28,
        paddingMD: 24,
        paddingSM: 20,
        headerFontSize: 16,
        headerLineHeight: 1.5,
        boxShadow: isDark ? "none" : colors.shadowSm,
      },
      Table: {
        borderRadiusLG: 10,
        headerBg: isDark ? "#1F2937" : "#F8FAFC",
        headerColor: isDark ? colors.textMain : colors.textSub,
        headerSplitColor: "transparent",
        cellPaddingBlock: 14,
        cellPaddingInline: 16,
        rowHoverBg: isDark ? "rgba(249, 115, 22, 0.08)" : "#FFF7ED",
        fontSize: 14,
        lineHeight: 1.6,
      },
      Input: {
        controlHeight: 40,
        borderRadius: 8,
        paddingBlock: 10,
        paddingInline: 12,
        colorBgContainer: isDark ? "#111827" : "#FFFFFF",
        activeBorderColor: BRAND_TOKENS.primary,
        hoverBorderColor: BRAND_TOKENS.primaryHover,
        fontSize: 14,
        lineHeight: 1.5,
      },
      Select: {
        controlHeight: 40,
        borderRadius: 8,
        paddingBlock: 10,
        paddingInline: 12,
        optionSelectedBg: isDark ? "rgba(249, 115, 22, 0.15)" : "#FFF7ED",
        optionLineHeight: 1.6,
        fontSize: 14,
        lineHeight: 1.5,
      },
      Modal: {
        borderRadiusLG: 16,
        headerBg: colors.bgElevated,
        contentBg: colors.bgElevated,
        titleFontSize: 18,
      },
      Menu: {
        itemHeight: 44,
        itemBorderRadius: 8,
        itemMarginInline: 8,
        itemPaddingBlock: 10,
        itemPaddingInline: 12,
        itemSelectedBg: isDark ? "rgba(249, 115, 22, 0.15)" : "#FFF7ED",
        itemSelectedColor: BRAND_TOKENS.primary,
        subMenuItemBg: "transparent",
        activeBarBorderWidth: 0,
        fontSize: 14,
        lineHeight: 1.5,
      },
      Tabs: {
        itemSelectedColor: BRAND_TOKENS.primary,
        itemHoverColor: BRAND_TOKENS.primaryHover,
        inkBarColor: BRAND_TOKENS.primary,
        titleFontSize: 14,
      },
      Tag: {
        borderRadiusSM: 4,
        fontSize: 12,
      },
      Layout: {
        bodyBg: colors.bgLayout,
        headerBg: colors.bgContainer,
        siderBg: colors.bgContainer,
      },
      Typography: {
        colorText: colors.textMain,
        colorTextDescription: colors.textSub,
        colorTextHeading: colors.textMain,
      },
    },
  };
};

export default function AntThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const isDark = useThemeDetector();
  const themeConfig = useMemo(() => createThemeConfig(isDark), [isDark]);
  const currentColors = isDark ? SYSTEM_COLORS.dark : SYSTEM_COLORS.light;

  return (
    <ConfigProvider
      locale={thTH}
      theme={themeConfig}
      componentSize="middle"
      input={{ autoComplete: "off" }}
    >
      <style jsx global>{`
        /* Global Reset & Body */
        body {
          background-color: ${currentColors.bgLayout} !important;
          color: ${currentColors.textMain};
          font-family: "Kanit", -apple-system, BlinkMacSystemFont, "Segoe UI", "Inter", sans-serif;
          font-size: 14px;
          line-height: 1.6;
          letter-spacing: 0.3px;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          transition: background-color 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        h1, h2, h3, h4, h5, h6 {
          letter-spacing: 0.2px;
          line-height: 1.3;
          margin-bottom: 0.5em;
        }

        /* Modern Scrollbar */
        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        ::-webkit-scrollbar-track {
          background: transparent;
        }
        ::-webkit-scrollbar-thumb {
          background-color: ${isDark ? "#4B5563" : "#CBD5E1"};
          border-radius: 99px;
          border: 2px solid transparent;
          background-clip: content-box;
        }
        ::-webkit-scrollbar-thumb:hover {
          background-color: ${BRAND_TOKENS.primary};
        }

        /* Glassmorphism Utilities */
        .glass {
          background: ${isDark
            ? "rgba(31, 41, 55, 0.7)"
            : "rgba(255, 255, 255, 0.7)"};
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid
            ${isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(255, 255, 255, 0.5)"};
        }

        /* Gradient Text */
        .text-gradient {
          background: linear-gradient(
            135deg,
            ${BRAND_TOKENS.primary},
            ${BRAND_TOKENS.warning}
          );
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        /* Smooth Transitions */
        a,
        button,
        input {
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }

        /* Selection */
        ::selection {
          background: ${BRAND_TOKENS.primaryShadow};
          color: ${BRAND_TOKENS.primaryActive};
        }

        /* Card Hover Effect */
        .hover-card {
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .hover-card:hover {
          transform: translateY(-2px);
          box-shadow: ${currentColors.shadowLg};
        }

        /* Ant Design Overrides */
        .ant-btn-primary {
          box-shadow: 0 4px 6px -1px rgba(249, 115, 22, 0.3) !important;
        }
        .ant-btn-primary:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 8px -1px rgba(249, 115, 22, 0.4) !important;
        }
        .ant-menu-item-selected {
          font-weight: 500;
        }

        /* Layout Fixes */
        .ant-layout {
          background: ${currentColors.bgLayout} !important;
        }
        .ant-layout-header {
          height: 64px;
          padding-inline: 24px;
          line-height: 64px;
          background: ${currentColors.bgContainer} !important;
          border-bottom: 1px solid ${currentColors.border};
        }

        .ant-layout-sider {
          background: ${currentColors.bgContainer} !important;
          border-right: 1px solid ${currentColors.border};
        }
      `}</style>
      {children}
    </ConfigProvider>
  );
}
