"use client";

import React, { useEffect, useMemo, useState } from "react";
import { App, ConfigProvider, theme } from "antd";
import type { ThemeConfig } from "antd";
import thTH from "antd/locale/th_TH";
import dayjs from "dayjs";
import "dayjs/locale/th";

dayjs.locale("th");

// --- Modern Flat Color Palette (No Shadows) ---
const BRAND_TOKENS = {
  primary: "#F97316",
  primaryHover: "#FB923C",
  primaryActive: "#EA580C",
  success: "#10B981",
  warning: "#F59E0B",
  error: "#EF4444",
  info: "#3B82F6",
};

const SYSTEM_COLORS = {
  light: {
    bgBase: "#FFFFFF",
    bgLayout: "#F1F5F9", // Slate-100 เพื่อให้ตัดกับ Container ที่เป็นสีขาวชัดเจนโดยไม่ต้องใช้เงา
    bgContainer: "#FFFFFF",
    bgElevated: "#FFFFFF",
    textMain: "#0F172A",
    textSub: "#64748B",
    textPlaceholder: "#94A3B8",
    border: "#E2E8F0", // Slate-200 (เส้นขอบชัดเจนเพื่อแบ่งสัดส่วน)
    borderStrong: "#CBD5E1", // Slate-300 สำหรับสถานะ Hover
  },
  dark: {
    bgBase: "#0B0F19",
    bgLayout: "#020617",
    bgContainer: "#111827",
    bgElevated: "#1F2937",
    textMain: "#F1F5F9",
    textSub: "#94A3B8",
    textPlaceholder: "#475569",
    border: "#334155", // Slate-700
    borderStrong: "#475569", // Slate-600
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

      colorBorder: colors.border,
      colorBorderSecondary: colors.border,

      fontFamily: '"Kanit", sans-serif',
      fontSize: 14,
      borderRadius: 4, // ลดความโค้งลงเพื่อให้เข้ากับ Flat Design
      borderRadiusLG: 8,

      // --- ลบระบบ Shadow ออกจาก Token หลัก ---
      boxShadow: "none",
      boxShadowSecondary: "none",
      boxShadowTertiary: "none",
      boxShadowInner: "none",

      controlHeight: 40,
      wireframe: true, // เปิด Wireframe เพื่อเน้นเส้นขอบแทนมิติเงา
    },
    components: {
      Button: {
        boxShadow: "none",
        boxShadowSecondary: "none",
        controlOutline: "none", // ลบวงแหวนเงาเวลาคลิก
        defaultShadow: "none",
        primaryShadow: "none",
        fontWeight: 500,
      },
      Card: {
        boxShadow: "none",
        boxShadowTertiary: "none",
        colorBorderSecondary: colors.border,
      },
      Table: {
        headerBg: isDark ? "#111827" : "#F8FAFC",
        headerSplitColor: colors.border,
        borderColor: colors.border,
      },
      Input: {
        boxShadow: "none",
        colorBgContainer: isDark ? "#020617" : "#FFFFFF",
      },
      Select: {
        boxShadow: "none",
        controlOutline: "none",
      },
      Modal: {
        boxShadow: "none",
        boxShadowTertiary: "none",
        headerBg: colors.bgElevated,
      },
      Menu: {
        itemSelectedBg: isDark ? "rgba(249, 115, 22, 0.15)" : "#FFF7ED",
        activeBarBorderWidth: 0,
      },
      Layout: {
        bodyBg: colors.bgLayout,
        headerBg: colors.bgContainer,
        siderBg: colors.bgContainer,
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
        /* Global Zero-Shadow Reset */
        * {
          box-shadow: none !important;
          text-shadow: none !important;
        }

        body {
          background-color: ${currentColors.bgLayout} !important;
          color: ${currentColors.textMain};
          font-family: "Kanit", sans-serif;
          -webkit-font-smoothing: antialiased;
        }

        /* Border-Based Dimension */
        .ant-card {
          border: 1px solid ${currentColors.border} !important;
        }

        .ant-layout-header {
          border-bottom: 1px solid ${currentColors.border} !important;
          background: ${currentColors.bgContainer} !important;
        }

        .ant-layout-sider {
          border-right: 1px solid ${currentColors.border} !important;
        }

        /* Modern Scrollbar (No Shadows) */
        ::-webkit-scrollbar {
          width: 6px;
        }
        ::-webkit-scrollbar-track {
          background: ${currentColors.bgLayout};
        }
        ::-webkit-scrollbar-thumb {
          background-color: ${isDark ? "#334155" : "#CBD5E1"};
          border-radius: 0;
        }
        ::-webkit-scrollbar-thumb:hover {
          background-color: ${BRAND_TOKENS.primary};
        }

        /* Focus & Hover States using Border instead of Shadow */
        .ant-input:focus,
        .ant-input-focused,
        .ant-select-focused .ant-select-selector {
          border-color: ${BRAND_TOKENS.primary} !important;
          outline: none !important;
        }

        .ant-btn:hover {
          border-color: ${BRAND_TOKENS.primaryHover} !important;
        }

        /* Typography */
        .text-gradient {
          background: linear-gradient(
            135deg,
            ${BRAND_TOKENS.primary},
            ${BRAND_TOKENS.warning}
          );
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        /* Transition */
        a,
        button,
        input {
          transition:
            border-color 0.2s,
            background-color 0.2s,
            color 0.2s;
        }

        /* Selection */
        ::selection {
          background: ${BRAND_TOKENS.primary};
          color: #ffffff;
        }

        /* Card Flat Hover */
        .hover-card:hover {
          border-color: ${BRAND_TOKENS.primary} !important;
          background-color: ${isDark ? "#1F2937" : "#F8FAFC"} !important;
        }
      `}</style>
      <App>{children}</App>
    </ConfigProvider>
  );
}
