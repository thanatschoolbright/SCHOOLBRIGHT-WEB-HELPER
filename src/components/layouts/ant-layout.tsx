"use client";

import type { ThemeConfig } from "antd";
import { App, ConfigProvider, theme } from "antd";
import thTH from "antd/locale/th_TH";
import dayjs from "dayjs";
import "dayjs/locale/th";
import buddhistEra from "dayjs/plugin/buddhistEra";
import React, { useEffect, useMemo, useState } from "react";

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
      fontSize: 14, // Standard Ant Design font size
      borderRadius: 12, // เพิ่มความโค้งมนให้ดู Friendly มากขึ้น
      borderRadiusLG: 20, // สำหรับ Component ใหญ่เช่น Card, Modal
      borderRadiusSM: 8,
      borderRadiusXS: 4,

      // --- ลูกเล่น: ใส่เงาบางๆ (Soft Shadows) เพื่อสร้างมิติแบบ Layered Design ---
      boxShadow: isDark
        ? "0 4px 12px 0 rgba(0, 0, 0, 0.4)"
        : "0 4px 12px 0 rgba(15, 23, 42, 0.04)",
      boxShadowSecondary: isDark
        ? "0 8px 24px 0 rgba(0, 0, 0, 0.5)"
        : "0 8px 24px 0 rgba(15, 23, 42, 0.06)",

      controlHeight: 40, // ความสูงมาตรฐานที่กดง่ายและดูสะอาดตา
      wireframe: false,
    },
    components: {
      Button: {
        controlOutline: "none",
        fontWeight: 500,
        borderRadius: 12, // ปุ่มมนโค้ง
        paddingInline: 20, // เพิ่มพื้นที่ด้านข้างให้ปุ่มดูไม่อึดอัด
      },
      Card: {
        colorBorderSecondary: "transparent",
        paddingLG: 24,
        borderRadiusLG: 20,
      },
      Table: {
        headerBg: isDark ? "#111827" : "#F8FAFC",
        headerSplitColor: "transparent",
        borderColor: colors.border,
        borderRadius: 12,
      },
      Input: {
        colorBgContainer: isDark ? "#020617" : "#FFFFFF",
        activeBorderColor: BRAND_TOKENS.primary,
        hoverBorderColor: BRAND_TOKENS.primaryHover,
        borderRadius: 12,
      },
      Select: {
        controlOutline: "none",
        borderRadius: 12,
      },
      Modal: {
        headerBg: colors.bgElevated,
        borderRadiusLG: 28, // Modal มนโค้งเป็นพิเศษเพื่อความพรีเมียม
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
          letter-spacing: 0.01em; /* เพิ่มระยะห่างตัวอักษรเล็กน้อยเพื่อความอ่านง่าย */
        }

        /* Modern Card & Shadow Level */
        .ant-card {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
          border: 1px solid ${isDark ? "#1E293B" : "#E2E8F0"} !important;
          border-radius: 20px !important; /* จัดความโค้งมนให้สม่ำเสมอ */
        }

        .ant-card:hover {
          transform: translateY(-4px); /* เพิ่มความลอยตัวเล็กน้อย */
          box-shadow: ${isDark
            ? "0 12px 30px -10px rgba(0, 0, 0, 0.6)"
            : "0 12px 30px -10px rgba(15, 23, 42, 0.12)"} !important;
        }

        /* Input & Select Rounded Style */
        .ant-input,
        .ant-select-selector,
        .ant-btn {
          border-radius: 12px !important;
        }

        /* Glassmorphism subtle effect for Layout Header */
        .ant-layout-header {
          border-bottom: 1px solid ${isDark ? "#1E293B" : "#F1F5F9"} !important;
          background: ${isDark
            ? "rgba(11, 15, 25, 0.85)"
            : "rgba(255, 255, 255, 0.85)"} !important;
          backdrop-filter: blur(12px);
          position: sticky;
          top: 0;
          z-index: 1000;
          padding: 0 24px !important;
        }

        /* Modern Scrollbar */
        ::-webkit-scrollbar {
          width: 6px; /* ให้เล็กลงดู Minimal */
        }
        ::-webkit-scrollbar-track {
          background: transparent;
        }
        ::-webkit-scrollbar-thumb {
          background-color: ${isDark ? "#334155" : "#CBD5E1"};
          border-radius: 20px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background-color: ${BRAND_TOKENS.primary};
        }

        /* Global Playful Transitions */
        a,
        button,
        .ant-menu-item,
        .ant-btn,
        .ant-input,
        .ant-select {
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1) !important;
        }

        /* Table Border Radius */
        .ant-table {
          border-radius: 16px !important;
          overflow: hidden;
          border: 1px solid ${isDark ? "#1E293B" : "#F1F5F9"} !important;
        }

        /* Selection */
        ::selection {
          background: ${BRAND_TOKENS.primary}40;
          color: inherit;
        }
      `}</style>
      <App>{children}</App>
    </ConfigProvider>
  );
}
