"use client";

import React, { useEffect, useMemo, useState } from "react";
import { App, ConfigProvider, theme } from "antd";
import type { ThemeConfig } from "antd";
import thTH from "antd/locale/th_TH";
import dayjs from "dayjs";
import "dayjs/locale/th";
import buddhistEra from "dayjs/plugin/buddhistEra";

dayjs.extend(buddhistEra);
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
    textMain: "#FFFFFF", // ทำให้ตัวอักษรหลักขาวขึ้น
    textSub: "#CBD5E1", // ทำให้ตัวอักษรรอง (Secondary/Description) ชัดเจนขึ้น (Slate-300)
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
      fontSize: 15, // ขยับขนาดตัวอักษรให้ใหญ่ขึ้นเล็กน้อย (Modern Standard)
      borderRadius: 10, // เพิ่มความโค้งให้ดูนุ่มนวล ทันสมัย
      borderRadiusLG: 16, // สำหรับ Component ใหญ่เช่น Card, Modal
      borderRadiusSM: 6,
      borderRadiusXS: 4,

      // --- ลูกเล่น: ใส่เงาบางๆ (Soft Shadows) เพื่อสร้างมิติแบบ Layered Design ---
      boxShadow: isDark
        ? "0 4px 12px 0 rgba(0, 0, 0, 0.4)"
        : "0 4px 12px 0 rgba(15, 23, 42, 0.05)",
      boxShadowSecondary: isDark
        ? "0 8px 24px 0 rgba(0, 0, 0, 0.5)"
        : "0 8px 24px 0 rgba(15, 23, 42, 0.08)",

      controlHeight: 42, // เพิ่มความกว้างให้กดง่ายขึ้น
      wireframe: false,
    },
    components: {
      Button: {
        controlOutline: "none",
        fontWeight: 500,
        borderRadius: 12, // ปุ่มมนเป็นพิเศษ
      },
      Card: {
        colorBorderSecondary: "transparent", // ลดความแข็งของเส้นขอบ
        paddingLG: 24,
      },
      Table: {
        headerBg: isDark ? "#111827" : "#F8FAFC",
        headerSplitColor: "transparent",
        borderColor: colors.border,
      },
      Input: {
        colorBgContainer: isDark ? "#020617" : "#FFFFFF",
        activeBorderColor: BRAND_TOKENS.primary,
        hoverBorderColor: BRAND_TOKENS.primaryHover,
      },
      Select: {
        controlOutline: "none",
      },
      Modal: {
        headerBg: colors.bgElevated,
        borderRadiusLG: 24, // Modal มนโค้งมากเป็นพิเศษเพื่อความ Premium
      },
      Menu: {
        itemSelectedBg: isDark ? "rgba(249, 115, 22, 0.15)" : "#FFF7ED",
        activeBarBorderWidth: 0,
        itemBorderRadius: 10,
      },
      Layout: {
        bodyBg: colors.bgLayout,
        headerBg: colors.bgContainer,
        siderBg: colors.bgContainer,
      },
      Typography: {
        colorText: colors.textMain,
        colorTextDescription: colors.textSub,
        colorTextSecondary: colors.textSub,
        colorTextHeading: colors.textMain,
      },
      Descriptions: {
        labelBg: isDark ? "#1F2937" : "#F8FAFC",
        titleColor: colors.textMain,
        colorText: colors.textMain,
        colorTextSecondary: colors.textSub,
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
        /* Modern Typography & Smoothness */
        body {
          background-color: ${currentColors.bgLayout} !important;
          color: ${currentColors.textMain};
          font-family: "Kanit", sans-serif;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          letter-spacing: -0.01em;
        }

        /* Modern Card & Shadow Level */
        .ant-card {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
          border: 1px solid ${isDark ? "#1E293B" : "#F1F5F9"} !important;
        }

        .ant-card:hover {
          transform: translateY(-2px);
          box-shadow: ${isDark
            ? "0 10px 25px -5px rgba(0, 0, 0, 0.5)"
            : "0 10px 25px -5px rgba(15, 23, 42, 0.1)"} !important;
        }

        /* Glassmorphism subtle effect for Layout Header */
        .ant-layout-header {
          border-bottom: 1px solid ${currentColors.border} !important;
          background: ${isDark
            ? "rgba(17, 24, 39, 0.8)"
            : "rgba(255, 255, 255, 0.8)"} !important;
          backdrop-filter: blur(8px);
          position: sticky;
          top: 0;
          z-index: 1000;
        }

        /* Modern Scrollbar */
        ::-webkit-scrollbar {
          width: 8px;
        }
        ::-webkit-scrollbar-track {
          background: transparent;
        }
        ::-webkit-scrollbar-thumb {
          background-color: ${isDark ? "#334155" : "#E2E8F0"};
          border-radius: 20px;
          border: 2px solid transparent;
          background-clip: content-box;
        }
        ::-webkit-scrollbar-thumb:hover {
          background-color: ${BRAND_TOKENS.primary};
        }

        /* Global Playful Transitions */
        a,
        button,
        .ant-menu-item,
        .ant-btn {
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1) !important;
        }

        /* Selection */
        ::selection {
          background: ${BRAND_TOKENS.primary}40;
          color: inherit;
        }

        /* Typography Gradient */
        .text-gradient {
          background: linear-gradient(
            135deg,
            ${BRAND_TOKENS.primary},
            #f97316,
            #fb923c
          );
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          font-weight: 700;
        }

        /* Custom Hover Glow */
        .hover-glow:hover {
          box-shadow: 0 0 15px ${BRAND_TOKENS.primary}30 !important;
          border-color: ${BRAND_TOKENS.primary} !important;
        }
      `}</style>
      <App>{children}</App>
    </ConfigProvider>
  );
}
