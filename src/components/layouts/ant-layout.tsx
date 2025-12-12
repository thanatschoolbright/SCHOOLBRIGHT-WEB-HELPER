"use client";

import React, { useEffect, useMemo, useState } from "react";
import { ConfigProvider, theme } from "antd";
import type { ThemeConfig } from "antd";
import thTH from "antd/locale/th_TH";
import dayjs from "dayjs";
import "dayjs/locale/th";

dayjs.locale("th");

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
}

const getLightPalette = (): ColorPalette => ({
  primary: "#F97316",
  primaryHover: "#FB923C",
  primaryActive: "#EA580C",
  primaryBg: "#FFF7ED",
  primaryShadow: "rgba(249, 115, 22, 0.25)",
  backgroundBase: "#F5F5F4",
  backgroundElevated: "#FAFAF9",
  backgroundSubtle: "#E7E5E4",
  border: "#D6D3D1",
  borderLight: "#E7E5E4",
  textPrimary: "#1C1917",
  textSecondary: "#57534E",
  textTertiary: "#A8A29E",
  modalMask: "rgba(28, 25, 23, 0.4)",
  shadowSoft: "0 4px 20px -2px rgba(0, 0, 0, 0.04)",
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
  modalMask: "rgba(0, 0, 0, 0.75)",
  shadowSoft: "0 10px 30px -4px rgba(0, 0, 0, 0.4)",
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
      '"LINESeedSansTH", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontSize: 14,
    fontWeightStrong: 600,

    borderRadius: 8,
    borderRadiusLG: 12,
    borderRadiusSM: 6,
    borderRadiusXS: 4,

    controlHeight: 44,
    controlHeightLG: 52,
    controlHeightSM: 36,

    boxShadow: palette.shadowSoft,
    boxShadowSecondary: palette.shadowSoft,
  },

  components: {
    Layout: {
      headerBg: isDark ? "rgba(17, 24, 39, 0.8)" : "rgba(250, 250, 249, 0.9)",
      bodyBg: palette.backgroundBase,
      siderBg: palette.backgroundElevated,
    },
    Button: {
      controlHeight: 42,
      borderRadius: 10,
      fontWeight: 500,
      defaultBorderColor: "transparent",
      defaultBg: palette.backgroundElevated,
      defaultShadow: "0 2px 8px rgba(0,0,0,0.04)",
      primaryShadow: `0 4px 14px 0 ${palette.primaryShadow}`,
      textHoverBg: palette.backgroundSubtle,
      contentFontSize: 14,
    },
    Input: {
      controlHeight: 42,
      borderRadius: 10,
      colorBgContainer: isDark ? "#1F2937" : "#FFFFFF",
      colorBorder: isDark ? "transparent" : "#D6D3D1",
      activeBorderColor: palette.primary,
      hoverBorderColor: isDark ? "#374151" : "#A8A29E",
      activeShadow: `0 0 0 2px ${palette.primaryBg}`,
      addonBg: palette.backgroundSubtle,
    },
    Select: {
      controlHeight: 42,
      borderRadius: 10,
      colorBgContainer: isDark ? "#1F2937" : "#FFFFFF",
      colorBorder: isDark ? "transparent" : "#D6D3D1",
      selectorBg: isDark ? "#1F2937" : "#FFFFFF",
    },
    Card: {
      borderRadiusLG: 16,
      colorBgContainer: palette.backgroundElevated,
      headerFontSize: 16,
      headerFontWeight: 600,
      boxShadow: palette.shadowSoft,
      colorBorderSecondary: palette.borderLight,
    },
    Table: {
      borderRadiusLG: 12,
      headerBg: "transparent",
      headerColor: palette.textSecondary,
      headerSplitColor: "transparent",
      rowHoverBg: palette.backgroundSubtle,
      borderColor: isDark ? "#374151" : "#E7E5E4",
    },
    Menu: {
      itemBorderRadius: 8,
      itemSelectedBg: palette.primaryBg,
      itemSelectedColor: palette.primary,
      itemActiveBg: palette.backgroundSubtle,
      subMenuItemBg: "transparent",
    },
    Modal: {
      borderRadiusLG: 20,
      headerBg: "transparent",
      contentBg: palette.backgroundElevated,
      boxShadow: isDark
        ? "0 25px 50px -12px rgba(0, 0, 0, 0.5)"
        : "0 25px 50px -12px rgba(0, 0, 0, 0.15)",
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
      itemSelectedShadow: "0 2px 8px rgba(0,0,0,0.08)",
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
    <ConfigProvider locale={thTH} theme={themeConfig} componentSize="middle">
      {children}
    </ConfigProvider>
  );
}
