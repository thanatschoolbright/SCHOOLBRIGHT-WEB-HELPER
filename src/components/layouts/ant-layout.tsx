"use client";

import React, { useEffect, useMemo, useState } from "react";
import { ConfigProvider, theme } from "antd";
import type { ThemeConfig } from "antd";
import thTH from "antd/locale/th_TH";
import dayjs from "dayjs";
import "dayjs/locale/th";

dayjs.locale("th");

// School Bright Brand Colors
const BRAND_COLORS = {
  orange: {
    50: "#fff7ed",
    100: "#ffedd5",
    200: "#fed7aa",
    300: "#fdba74",
    400: "#fb923c",
    500: "#f97316", // Primary
    600: "#ea580c",
    700: "#c2410c",
    800: "#9a3412",
    900: "#7c2d12",
  },
} as const;

interface ColorPalette {
  primary: string;
  primaryHover: string;
  primaryActive: string;
  primaryBg: string;
  backgroundBase: string;
  backgroundElevated: string;
  backgroundSubtle: string;
  border: string;
  borderLight: string;
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  modalMask: string;
}

const getLightPalette = (): ColorPalette => ({
  primary: BRAND_COLORS.orange[500],
  primaryHover: BRAND_COLORS.orange[400],
  primaryActive: BRAND_COLORS.orange[600],
  primaryBg: BRAND_COLORS.orange[50],
  backgroundBase: "#fafbfc",
  backgroundElevated: "#ffffff",
  backgroundSubtle: "#f5f7fa",
  border: "#e5e7eb",
  borderLight: "#f0f2f5",
  textPrimary: "#0f172a",
  textSecondary: "#64748b",
  textTertiary: "#94a3b8",
  modalMask: "rgba(15, 23, 42, 0.35)",
});

const getDarkPalette = (): ColorPalette => ({
  primary: BRAND_COLORS.orange[400],
  primaryHover: BRAND_COLORS.orange[300],
  primaryActive: BRAND_COLORS.orange[500],
  primaryBg: "rgba(251, 146, 60, 0.12)",
  backgroundBase: "#0a0a0a",
  backgroundElevated: "#141414",
  backgroundSubtle: "#1a1a1a",
  border: "#262626",
  borderLight: "#303030",
  textPrimary: "rgba(255, 255, 255, 0.92)",
  textSecondary: "rgba(255, 255, 255, 0.65)",
  textTertiary: "rgba(255, 255, 255, 0.45)",
  modalMask: "rgba(0, 0, 0, 0.65)",
});

const useThemeDetector = (): boolean => {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const updateTheme = () => {
      setIsDark(document.documentElement.classList.contains("dark"));
    };

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
    // Colors
    colorPrimary: palette.primary,
    colorPrimaryHover: palette.primaryHover,
    colorPrimaryActive: palette.primaryActive,
    colorPrimaryBg: palette.primaryBg,
    colorPrimaryBgHover: isDark
      ? "rgba(251, 146, 60, 0.18)"
      : BRAND_COLORS.orange[100],
    colorText: palette.textPrimary,
    colorTextSecondary: palette.textSecondary,
    colorTextTertiary: palette.textTertiary,
    colorLink: palette.primary,
    colorLinkHover: palette.primaryHover,
    colorBorder: palette.border,
    colorBorderSecondary: palette.borderLight,
    colorBgBase: palette.backgroundBase,
    colorBgLayout: palette.backgroundBase,
    colorBgContainer: palette.backgroundElevated,
    colorBgElevated: palette.backgroundElevated,
    colorBgSpotlight: palette.backgroundSubtle,
    colorFillSecondary: palette.backgroundSubtle,
    colorBgMask: palette.modalMask,

    // Typography
    fontFamily:
      '"Sukhumvit", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontSize: 14,
    fontSizeHeading1: 32,
    fontSizeHeading2: 26,
    fontSizeHeading3: 22,
    fontSizeHeading4: 18,
    fontSizeHeading5: 16,

    // Border Radius
    borderRadius: 12,
    borderRadiusLG: 16,
    borderRadiusSM: 8,
    borderRadiusXS: 6,

    // Sizing
    controlHeight: 40,
    controlHeightLG: 48,
    controlHeightSM: 32,
    controlHeightXS: 24,

    // Spacing
    padding: 16,
    paddingLG: 24,
    paddingSM: 12,
    paddingXS: 8,
    margin: 16,
    marginLG: 24,
    marginSM: 12,
    marginXS: 8,

    // Semantic Colors
    colorSuccess: "#10b981",
    colorWarning: "#f59e0b",
    colorError: "#ef4444",
    colorInfo: "#3b82f6",

    // Effects
    boxShadow: "none",
    boxShadowSecondary: "none",
    lineWidth: 1,
    lineType: "solid",
  },
  components: {
    Layout: {
      headerBg: "transparent",
      headerPadding: "0 24px",
      headerHeight: 64,
      bodyBg: palette.backgroundBase,
      siderBg: palette.backgroundElevated,
      triggerBg: palette.backgroundSubtle,
      triggerColor: palette.textPrimary,
    },
    Button: {
      borderRadius: 10,
      controlHeight: 40,
      controlHeightLG: 48,
      controlHeightSM: 32,
      fontWeight: 500,
      paddingContentHorizontal: 20,
      primaryShadow: "none",
      defaultShadow: "none",
      dangerShadow: "none",
      defaultBorderColor: palette.border,
      defaultColor: palette.textPrimary,
      textHoverBg: palette.backgroundSubtle,
    },
    Input: {
      borderRadius: 10,
      controlHeight: 40,
      paddingBlock: 8,
      paddingInline: 12,
      colorBgContainer: palette.backgroundElevated,
      colorBorder: palette.border,
      hoverBorderColor: palette.primary,
      activeBorderColor: palette.primary,
      activeShadow: `0 0 0 2px ${palette.primaryBg}`,
    },
    InputNumber: {
      borderRadius: 10,
      controlHeight: 40,
      paddingBlock: 8,
      paddingInline: 12,
      colorBgContainer: palette.backgroundElevated,
      colorBorder: palette.border,
      hoverBorderColor: palette.primary,
      activeBorderColor: palette.primary,
      activeShadow: `0 0 0 2px ${palette.primaryBg}`,
    },
    Select: {
      borderRadius: 10,
      controlHeight: 40,
      colorBgContainer: palette.backgroundElevated,
      colorBorder: palette.border,
      optionSelectedBg: palette.primaryBg,
      optionSelectedColor: palette.primary,
      optionActiveBg: palette.backgroundSubtle,
    },
    DatePicker: {
      borderRadius: 10,
      controlHeight: 40,
      colorBgContainer: palette.backgroundElevated,
      colorBorder: palette.border,
      cellHoverBg: palette.backgroundSubtle,
      cellActiveWithRangeBg: palette.primaryBg,
      cellRangeBorderColor: palette.primary,
    },
    Card: {
      borderRadiusLG: 16,
      paddingLG: 24,
      colorBgContainer: palette.backgroundElevated,
      colorBorderSecondary: palette.border,
      headerHeight: 56,
      boxShadow: "none",
    },
    Modal: {
      borderRadiusLG: 16,
      colorBgElevated: palette.backgroundElevated,
      headerBg: palette.backgroundElevated,
      contentBg: palette.backgroundElevated,
      titleFontSize: 20,
      titleLineHeight: 1.4,
      bodyPadding: "24px",
      footerPadding: "16px 24px",
      boxShadow: isDark
        ? "0 20px 25px -5px rgba(0, 0, 0, 0.5)"
        : "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
    },
    Drawer: {
      colorBgElevated: palette.backgroundElevated,
      paddingLG: 24,
      footerPaddingBlock: 16,
      footerPaddingInline: 24,
    },
    Table: {
      borderRadius: 12,
      borderRadiusLG: 12,
      headerBg: palette.backgroundSubtle,
      headerColor: palette.textPrimary,
      headerSplitColor: "transparent",
      headerSortActiveBg: palette.backgroundSubtle,
      headerSortHoverBg: palette.backgroundSubtle,
      rowHoverBg: isDark ? "rgba(255, 255, 255, 0.04)" : "rgba(0, 0, 0, 0.02)",
      rowSelectedBg: palette.primaryBg,
      rowSelectedHoverBg: isDark
        ? "rgba(251, 146, 60, 0.18)"
        : BRAND_COLORS.orange[100],
      colorBgContainer: palette.backgroundElevated,
      borderColor: palette.border,
      headerBorderRadius: 12,
      cellPaddingBlock: 16,
      cellPaddingInline: 16,
      cellFontSize: 14,
      headerFontSize: 14,
      footerBg: palette.backgroundSubtle,
      footerColor: palette.textSecondary,
    },
    Tabs: {
      itemColor: palette.textSecondary,
      itemHoverColor: palette.textPrimary,
      itemSelectedColor: palette.primary,
      inkBarColor: palette.primary,
      cardBg: palette.backgroundElevated,
      cardGutter: 4,
    },
    Dropdown: {
      borderRadiusLG: 12,
      colorBgElevated: palette.backgroundElevated,
      controlItemBgHover: palette.backgroundSubtle,
      controlItemBgActive: palette.primaryBg,
      paddingBlock: 8,
      boxShadow: isDark
        ? "0 10px 15px -3px rgba(0, 0, 0, 0.3)"
        : "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
    },
    Menu: {
      itemBg: "transparent",
      itemColor: palette.textSecondary,
      itemHoverColor: palette.textPrimary,
      itemHoverBg: palette.backgroundSubtle,
      itemSelectedColor: palette.primary,
      itemSelectedBg: palette.primaryBg,
      itemActiveBg: palette.backgroundSubtle,
      subMenuItemBg: "transparent",
      borderRadius: 8,
      itemBorderRadius: 8,
    },
    Pagination: {
      itemBg: palette.backgroundElevated,
      itemActiveBg: palette.primary,
      itemLinkBg: palette.backgroundElevated,
      itemInputBg: palette.backgroundElevated,
      borderRadius: 8,
    },
    Tag: {
      borderRadiusSM: 6,
      defaultBg: palette.backgroundSubtle,
      defaultColor: palette.textPrimary,
    },
    Tooltip: {
      borderRadius: 8,
      colorBgSpotlight: isDark
        ? "rgba(0, 0, 0, 0.92)"
        : "rgba(15, 23, 42, 0.92)",
      colorTextLightSolid: "#ffffff",
    },
    Popover: {
      borderRadiusLG: 12,
      colorBgElevated: palette.backgroundElevated,
      boxShadow: isDark
        ? "0 10px 15px -3px rgba(0, 0, 0, 0.3)"
        : "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
    },
    Alert: {
      borderRadiusLG: 12,
      colorInfoBg: isDark ? "rgba(59, 130, 246, 0.12)" : "#eff6ff",
      colorSuccessBg: isDark ? "rgba(16, 185, 129, 0.12)" : "#f0fdf4",
      colorWarningBg: isDark ? "rgba(245, 158, 11, 0.12)" : "#fffbeb",
      colorErrorBg: isDark ? "rgba(239, 68, 68, 0.12)" : "#fef2f2",
    },
    Badge: {
      dotSize: 8,
      indicatorHeight: 20,
    },
    Breadcrumb: {
      itemColor: palette.textSecondary,
      lastItemColor: palette.textPrimary,
      linkColor: palette.textSecondary,
      linkHoverColor: palette.primary,
      separatorColor: palette.textTertiary,
      fontSize: 14,
    },
    Steps: {
      iconSize: 32,
      iconSizeSM: 24,
    },
    Form: {
      labelFontSize: 14,
      labelColor: palette.textPrimary,
      labelHeight: 40,
      itemMarginBottom: 24,
      verticalLabelPadding: "0 0 8px",
    },
    Segmented: {
      borderRadius: 10,
      itemSelectedBg: palette.primary,
      itemSelectedColor: "#ffffff",
      itemHoverBg: palette.backgroundSubtle,
      trackBg: palette.backgroundSubtle,
    },
    Switch: {
      handleSize: 18,
      trackHeight: 24,
      trackMinWidth: 44,
    },
    Checkbox: {
      borderRadiusSM: 4,
      size: 18,
    },
    Radio: {
      size: 18,
      dotSize: 10,
    },
    Skeleton: {
      colorBgBase: palette.backgroundSubtle,
      colorFill: isDark ? palette.backgroundElevated : "#e5e7eb",
      borderRadiusLG: 12,
    },
    Spin: {
      dotSize: 24,
      dotSizeSM: 16,
      dotSizeLG: 32,
    },
    Upload: {
      colorBorder: palette.border,
      colorFillAlter: palette.backgroundSubtle,
    },
    Avatar: {
      borderRadius: 100,
      containerSize: 40,
      containerSizeLG: 48,
      containerSizeSM: 32,
    },
    Timeline: {
      dotBg: palette.backgroundElevated,
      itemPaddingBottom: 24,
    },
    Collapse: {
      borderRadiusLG: 12,
      headerBg: palette.backgroundSubtle,
      contentBg: palette.backgroundElevated,
      headerPadding: "12px 16px",
      contentPadding: "16px",
    },
    Progress: {
      defaultColor: palette.primary,
      remainingColor: palette.backgroundSubtle,
      circleTextColor: palette.textPrimary,
      lineBorderRadius: 100,
    },
    Result: {
      titleFontSize: 24,
      subtitleFontSize: 14,
      iconFontSize: 72,
    },
    Statistic: {
      titleFontSize: 14,
      contentFontSize: 24,
    },
    Descriptions: {
      labelBg: palette.backgroundSubtle,
      itemPaddingBottom: 16,
      titleMarginBottom: 20,
    },
    Empty: {
      colorTextDisabled: palette.textTertiary,
    },
    Notification: {
      width: 384,
      borderRadiusLG: 12,
    },
    Message: {
      contentBg: palette.backgroundElevated,
      borderRadiusLG: 10,
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
    <ConfigProvider locale={thTH} theme={themeConfig}>
      {children}
    </ConfigProvider>
  );
}
