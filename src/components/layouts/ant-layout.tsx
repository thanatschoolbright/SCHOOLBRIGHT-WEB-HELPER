"use client";

import React, { useEffect, useMemo, useState } from "react";
import { ConfigProvider, theme } from "antd";
import type { ThemeConfig } from "antd";
import thTH from "antd/locale/th_TH";
import dayjs from "dayjs";
import "dayjs/locale/th";

dayjs.locale("th");

// --- School Bright Brand Color Palette ---
const BRAND_ORANGE = {
  primary: "#F97316", // Main Orange (School Bright Tone)
  hover: "#FB923C",
  active: "#EA580C",
  subtle: "rgba(249, 115, 22, 0.1)",
};

const SYSTEM_COLORS = {
  light: {
    primary: BRAND_ORANGE.primary,
    bgBase: "#F8FAFC",
    bgContainer: "#FFFFFF",
    bgElevated: "#FFFFFF", // สำหรับ Modal ในโหมดสว่าง
    textMain: "#0F172A",
    textSub: "#64748B",
    border: "#E2E8F0",
    shadow: "rgba(249, 115, 22, 0.08)",
  },
  dark: {
    primary: BRAND_ORANGE.primary,
    bgBase: "#0B0F19", // ลึกขึ้นเพื่อความพรีเมียม
    bgContainer: "#111827", // Dark Slate (ตัดอมม่วงออก)
    bgElevated: "#1F2937", // สีพื้นหลัง Modal/Popover ในโหมดมืด (Slate 800)
    textMain: "#F8FAFC",
    textSub: "#94A3B8",
    border: "#374151",
    shadow: "rgba(0, 0, 0, 0.5)",
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
      colorPrimary: colors.primary,
      colorInfo: colors.primary,
      colorSuccess: "#10B981",
      colorWarning: "#F59E0B",
      colorError: "#EF4444",

      colorTextBase: colors.textMain,
      colorTextSecondary: colors.textSub,

      colorBgBase: colors.bgBase,
      colorBgLayout: colors.bgBase,
      colorBgContainer: colors.bgContainer,
      colorBgElevated: colors.bgElevated, // แก้ปัญหา Modal สีอมม่วง

      colorBorder: colors.border,
      colorBorderSecondary: isDark ? "#1F2937" : "#F1F5F9",

      fontFamily: '"Inter", "Kanit", "GoogleSans", -apple-system, sans-serif',
      fontSize: 14,
      borderRadius: 12,

      controlHeight: 40,
      lineWidth: 1,
    },
    components: {
      Button: {
        borderRadius: 10,
        fontWeight: 600,
        controlHeightLG: 48,
        paddingInlineLG: 24,
        boxShadow: "none",
        primaryShadow: isDark ? "none" : `0 4px 12px rgba(249, 115, 22, 0.2)`,
      },
      Card: {
        borderRadiusLG: 24,
        colorBorderSecondary: isDark ? "#1F2937" : "#F1F5F9",
        boxShadowTertiary: `0 20px 25px -5px ${colors.shadow}`,
        paddingLG: 24,
      },
      Table: {
        borderRadiusLG: 16,
        headerBg: isDark ? "#1F2937" : "#FFF7ED",
        headerColor: isDark ? colors.textSub : BRAND_ORANGE.active,
        headerBorderRadius: 12,
        headerSplitColor: "transparent",
        rowHoverBg: isDark ? "rgba(249, 115, 22, 0.05)" : "#FFF7ED",
      },
      Input: {
        borderRadius: 10,
        colorBgContainer: isDark ? "#111827" : "#FFFFFF",
        activeShadow: `0 0 0 3px rgba(249, 115, 22, 0.15)`,
      },
      Modal: {
        borderRadiusLG: 24,
        headerBg: colors.bgElevated, // บังคับสี Header ให้ตรงกับ Body
        contentBg: colors.bgElevated,
        footerBg: colors.bgElevated,
        maskBg: "rgba(0, 0, 0, 0.75)",
      },
      Menu: {
        itemBorderRadius: 12,
        itemSelectedBg: "rgba(249, 115, 22, 0.12)",
        itemSelectedColor: BRAND_ORANGE.primary,
        colorBgElevated: colors.bgElevated, // สำหรับ Sub-menu dropdown
      },
      Popover: {
        colorBgElevated: colors.bgElevated,
      },
      Select: {
        borderRadius: 10,
        colorBgElevated: colors.bgElevated, // สำหรับ Dropdown list
      },
      Tag: {
        borderRadiusSM: 6,
        fontWeightStrong: 600,
      },
    } as any,
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
        body {
          background-color: ${currentColors.bgBase} !important;
          color: ${currentColors.textMain};
          transition: background-color 0.3s ease;
        }

        /* Modal & Popover Correction */
        .ant-modal-content,
        .ant-modal-header,
        .ant-select-dropdown {
          background-color: ${isDark
            ? SYSTEM_COLORS.dark.bgElevated
            : "#FFFFFF"} !important;
        }

        ::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        ::-webkit-scrollbar-thumb {
          background: ${isDark ? "#374151" : "#E2E8F0"};
          border-radius: 10px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: ${BRAND_ORANGE.primary};
        }

        .ant-btn-primary {
          background: linear-gradient(
            135deg,
            ${BRAND_ORANGE.primary} 0%,
            ${BRAND_ORANGE.active} 100%
          ) !important;
          border: none !important;
        }

        .ant-card {
          border: 1px solid
            ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.03)"} !important;
        }

        .glass-effect {
          background: ${isDark
            ? "rgba(17, 24, 39, 0.8)"
            : "rgba(255, 255, 255, 0.8)"} !important;
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
        }

        ::selection {
          background: ${BRAND_ORANGE.subtle};
          color: ${BRAND_ORANGE.active};
        }
      `}</style>
      {children}
    </ConfigProvider>
  );
}
