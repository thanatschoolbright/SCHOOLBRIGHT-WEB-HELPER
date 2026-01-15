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
  primary: "#F97316", // Main Orange
  hover: "#FB923C",
  active: "#EA580C",
  subtle: "rgba(249, 115, 22, 0.15)", // เพิ่มความเข้มเล็กน้อยให้เห็นชัดขึ้น
  outline: "rgba(249, 115, 22, 0.2)", // สี Ring เวลา Focus
};

const SYSTEM_COLORS = {
  light: {
    primary: BRAND_ORANGE.primary,
    bgBase: "#F8FAFC", // Slate-50
    bgContainer: "#FFFFFF",
    bgElevated: "#FFFFFF",
    textMain: "#1E293B", // Slate-800 (เข้มขึ้นให้อ่านชัด)
    textSub: "#64748B", // Slate-500
    border: "#E2E8F0", // Slate-200
    shadow: "0 10px 30px -10px rgba(249, 115, 22, 0.15)",
  },
  dark: {
    primary: BRAND_ORANGE.primary,
    bgBase: "#0B0F19",
    bgContainer: "#111827", // Gray-900
    bgElevated: "#1F2937", // Gray-800
    textMain: "#F8FAFC", // Slate-50
    textSub: "#94A3B8", // Slate-400
    border: "#374151", // Gray-700
    shadow: "0 10px 30px -10px rgba(0, 0, 0, 0.6)",
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
      colorPrimary: colors.primary,
      colorInfo: colors.primary,
      colorSuccess: "#10B981",
      colorWarning: "#F59E0B",
      colorError: "#EF4444",

      colorTextBase: colors.textMain,
      colorTextSecondary: colors.textSub,
      colorBgBase: colors.bgBase,
      colorBgContainer: colors.bgContainer,
      colorBgElevated: colors.bgElevated,

      colorBorder: colors.border,
      colorBorderSecondary: isDark ? "#374151" : "#E2E8F0",

      // --- Typography & Sizing (ขยายให้ใหญ่ขึ้น) ---
      fontFamily: '"Inter", "Kanit", "GoogleSans", -apple-system, sans-serif',
      fontSize: 15, // ขยายจาก 14 เป็น 15 เพื่อให้อ่านง่าย
      fontSizeHeading1: 32,
      fontSizeHeading2: 26,
      fontSizeHeading3: 22,

      // --- Shape & Dimension ---
      borderRadius: 8, // Standard Component (Input, Button) ให้ดู Modern ไม่กลมเกินไป
      borderRadiusLG: 16, // Large Component (Card, Modal)

      controlHeight: 42, // ขยายความสูง Input/Button จาก 40 เป็น 42
      controlHeightLG: 50,
      controlHeightSM: 32,

      lineWidth: 1,
    },
    components: {
      Button: {
        controlHeight: 42,
        borderRadius: 8,
        fontWeight: 600,
        contentFontSize: 15,
        paddingInline: 20, // เพิ่ม Padding แนวนอน
        primaryShadow: "0 4px 10px rgba(249, 115, 22, 0.25)", // เงาปุ่มที่สวยขึ้น
        defaultShadow: "none",
      },
      Card: {
        borderRadiusLG: 20, // โค้งมน
        paddingLG: 32, // เพิ่ม Padding ภายใน Card ให้เนื้อหาหายใจสะดวก (Space)
        headerFontSize: 18,
        headerFontWeight: 600,
      },
      Table: {
        borderRadiusLG: 12,
        headerBg: isDark ? "#1F2937" : "#FFF7ED", // สีหัวตาราง Orange Tint อ่อนๆ
        headerColor: isDark ? colors.textSub : "#9A3412", // Text สีส้มเข้ม
        headerBorderRadius: 12,
        headerSplitColor: "transparent",
        cellPaddingBlock: 16, // เพิ่มความสูงของแต่ละ Row
        rowHoverBg: isDark ? "rgba(249, 115, 22, 0.08)" : "#FFF7ED",
      },
      Input: {
        controlHeight: 42,
        borderRadius: 8,
        paddingInline: 16,
        colorBgContainer: isDark ? "#111827" : "#FFFFFF",
        activeBorderColor: BRAND_ORANGE.primary,
        hoverBorderColor: BRAND_ORANGE.hover,
        activeShadow: `0 0 0 3px ${BRAND_ORANGE.outline}`, // Focus ring สวยๆ
      },
      Select: {
        controlHeight: 42,
        borderRadius: 8,
        controlItemBgActive: BRAND_ORANGE.subtle,
      },
      Modal: {
        borderRadiusLG: 20,
        headerBg: colors.bgElevated,
        contentBg: colors.bgElevated,
        titleFontSize: 20,
        paddingContentHorizontalLG: 32, // Modal กว้างขึ้น สบายตา
      },
      Menu: {
        itemBorderRadius: 8,
        itemHeight: 44, // เมนูสูงขึ้น กดง่าย
        itemSelectedBg: BRAND_ORANGE.subtle,
        itemSelectedColor: BRAND_ORANGE.primary,
        subMenuItemBg: "transparent",
      },
      Tabs: {
        itemSelectedColor: BRAND_ORANGE.primary,
        itemHoverColor: BRAND_ORANGE.hover,
        titleFontSize: 15,
      },
      Tag: {
        borderRadiusSM: 6,
        fontWeightStrong: 500,
        fontSize: 13,
      },
      Form: {
        itemMarginBottom: 24, // ระยะห่างระหว่าง Input field มากขึ้น
        labelFontSize: 14,
        labelColor: colors.textSub,
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
        /* Global Reset & Body */
        body {
          background-color: ${currentColors.bgBase} !important;
          color: ${currentColors.textMain};
          font-size: 15px; /* Base font size ใหญ่ขึ้น */
          line-height: 1.6;
          transition: background-color 0.3s ease, color 0.3s ease;
        }

        /* Smooth Fonts */
        * {
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }

        /* Modern Gradient Button */
        .ant-btn-primary:not(:disabled) {
          background: linear-gradient(
            145deg,
            ${BRAND_ORANGE.primary} 0%,
            ${BRAND_ORANGE.active} 100%
          ) !important;
          border: none !important;
          transition: all 0.2s ease-in-out;
        }
        .ant-btn-primary:not(:disabled):hover {
          transform: translateY(-1px); /* ยกปุ่มขึ้นเล็กน้อยเวลา Hover */
          box-shadow: 0 6px 15px rgba(249, 115, 22, 0.35);
        }

        /* Card Enhancement */
        .ant-card {
          border: 1px solid
            ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.04)"} !important;
          box-shadow: ${currentColors.shadow} !important;
          transition: box-shadow 0.3s ease, transform 0.3s ease;
        }
        /* ถ้าเป็น Interactive Card ให้มี Effect */
        .ant-card-hoverable:hover {
          transform: translateY(-4px);
          box-shadow: 0 20px 40px -10px rgba(249, 115, 22, 0.15) !important;
        }

        /* Modal & Popover Background Fix */
        .ant-modal-content,
        .ant-modal-header,
        .ant-popover-inner,
        .ant-select-dropdown {
          background-color: ${isDark
            ? SYSTEM_COLORS.dark.bgElevated
            : "#FFFFFF"} !important;
          border: 1px solid ${isDark ? "rgba(255,255,255,0.05)" : "transparent"};
        }

        /* Glassmorphism Class (Optional usage) */
        .glass-panel {
          background: ${isDark
            ? "rgba(17, 24, 39, 0.75)"
            : "rgba(255, 255, 255, 0.75)"} !important;
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid
            ${isDark ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.4)"};
        }

        /* Scrollbar Styling */
        ::-webkit-scrollbar {
          width: 7px;
          height: 7px;
        }
        ::-webkit-scrollbar-track {
          background: transparent;
        }
        ::-webkit-scrollbar-thumb {
          background: ${isDark ? "#374151" : "#CBD5E1"};
          border-radius: 10px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: ${BRAND_ORANGE.primary};
        }

        /* Selection Color */
        ::selection {
          background: ${BRAND_ORANGE.subtle};
          color: ${BRAND_ORANGE.active};
        }
      `}</style>
      {children}
    </ConfigProvider>
  );
}
