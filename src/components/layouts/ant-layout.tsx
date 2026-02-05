"use client";

import type { ThemeConfig } from "antd";
import { App, ConfigProvider, theme } from "antd";
import thTH from "antd/locale/th_TH";
import dayjs from "dayjs";
import "dayjs/locale/th";
import buddhistEra from "dayjs/plugin/buddhistEra";
import React, { useEffect, useMemo, useState } from "react";

// ✨ Setup สำหรับปฏิทินไทยและปีพุทธศักราช
dayjs.extend(buddhistEra);
dayjs.locale("th");

/**
 * 🎨 BRAND SEED TOKENS
 * ค่าพื้นฐานสำหรับคำนวณเฉดสีและสัดส่วนพื้นฐานของทั้งระบบ
 */
const BRAND_SEED = {
  primary: "#F97316", // Orange-500
  success: "#10B981", // Emerald-500
  warning: "#F59E0B", // Amber-500
  error: "#EF4444", // Red-500
  info: "#3B82F6", // Blue-500
  radius: 12,
  fontFamily: 'var(--font-google-sans), "Google Sans", sans-serif',
};

/**
 * 🛠️ SYSTEM COLORS (Manual Mapping for specific Slate shades)
 */
const SYSTEM_COLORS = {
  light: {
    bgLayout: "#F1F5F9",
    bgContainer: "#FFFFFF",
    textMain: "#0F172A",
    textSub: "#64748B",
    border: "#E2E8F0",
  },
  dark: {
    bgLayout: "#000000",
    bgContainer: "#141414",
    textMain: "#FFFFFF",
    textSub: "#CBD5E1",
    border: "#262626",
  },
};

/**
 * 🛡️ THEME DETECTOR
 * ตรวจสอบโหมด Dark/Light จากคลาส 'dark' ใน <html>
 */
const useDarkTheme = (): boolean => {
  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    const checkDark = () =>
      setIsDark(document.documentElement.classList.contains("dark"));
    const observer = new MutationObserver(checkDark);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    checkDark();
    return () => observer.disconnect();
  }, []);
  return isDark;
};

/**
 * 💎 CREATE THEME CONFIG (Ant Design v5 Best Practice)
 * แยกส่วน Seed -> Map -> Alias Tokens ให้ชัดเจน
 */
const getThemeConfig = (isDark: boolean): ThemeConfig => {
  const colors = isDark ? SYSTEM_COLORS.dark : SYSTEM_COLORS.light;

  return {
    // 🚀 ใช้อัลกอริทึมมาตรฐานตามที่ AntD แนะนำ
    algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm,

    // ✨ Global Design Tokens (Seed + Alias)
    token: {
      colorPrimary: BRAND_SEED.primary,
      colorSuccess: BRAND_SEED.success,
      colorWarning: BRAND_SEED.warning,
      colorError: BRAND_SEED.error,
      colorInfo: BRAND_SEED.info,

      colorBgBase: isDark ? "#000000" : "#FFFFFF",
      colorBgLayout: colors.bgLayout,
      colorBgContainer: colors.bgContainer,
      colorBgElevated: isDark ? "#1C1C1C" : "#FFFFFF",
      colorTextBase: colors.textMain,
      colorTextSecondary: colors.textSub,
      colorBorder: colors.border,

      fontFamily: BRAND_SEED.fontFamily,
      fontSize: 14,
      borderRadius: BRAND_SEED.radius,
      borderRadiusLG: 20,

      controlHeight: 40,
      wireframe: false,
    },

    // 📦 Component-level Customization
    components: {
      Button: {
        controlOutline: "none",
        fontWeight: 500,
        borderRadius: 12,
        paddingInline: 20,
      },
      Card: {
        colorBorderSecondary: "transparent",
        paddingLG: 24,
        borderRadiusLG: 20,
      },
      Table: {
        headerBg: isDark ? "#1C1C1C" : "#F8FAFC",
        headerSplitColor: "transparent",
        headerBorderRadius: 12,
      },
      Input: {
        borderRadius: 12,
        colorBgContainer: isDark ? "#141414" : "#FFFFFF",
      },
      Select: {
        borderRadius: 12,
      },
      Modal: {
        borderRadiusLG: 28,
        headerBg: isDark ? "#1C1C1C" : "#FFFFFF",
        contentBg: isDark ? "#1C1C1C" : "#FFFFFF",
        footerBg: isDark ? "#1C1C1C" : "#FFFFFF",
      },
      Layout: {
        bodyBg: colors.bgLayout,
        headerBg: isDark ? "rgba(0, 0, 0, 0.85)" : "rgba(255, 255, 255, 0.85)",
        headerPadding: "0 24px",
      },
      Menu: {
        itemBorderRadius: 10,
        activeBarBorderWidth: 0,
      },
    },
  };
};

export default function AntThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const isDark = useDarkTheme();
  const themeConfig = useMemo(() => getThemeConfig(isDark), [isDark]);
  const currentColors = isDark ? SYSTEM_COLORS.dark : SYSTEM_COLORS.light;

  return (
    <ConfigProvider
      locale={thTH}
      theme={themeConfig}
      componentSize="middle"
      input={{ autoComplete: "off" }}
    >
      {/* 🚀 Wrapper <App /> เพื่อให้ Message/Modal/Notification ทำงานร่วมกันได้อย่างราบรื่น */}
      <App>
        <style jsx global>{`
          /* 🌊 Modern Typography & Experience */
          body {
            background-color: ${currentColors.bgLayout} !important;
            color: ${currentColors.textMain};
            font-family: ${BRAND_SEED.fontFamily};
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
            transition: background-color 0.3s ease;
          }

          /* 🖱️ Modern Scrollbar */
          ::-webkit-scrollbar {
            width: 6px;
          }
          ::-webkit-scrollbar-track {
            background: transparent;
          }
          ::-webkit-scrollbar-thumb {
            background: ${isDark ? "#334155" : "#CBD5E1"};
            border-radius: 10px;
          }
          ::-webkit-scrollbar-thumb:hover {
            background: ${BRAND_SEED.primary};
          }

          /* ✨ Interactive Card Feedback */
          .ant-card {
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
            border: 1px solid ${isDark ? "#1E293B" : "#E2E8F0"} !important;
          }

          /* ลบส่วนนี้ออกทั้งหมด */
          .ant-card:hover {
            box-shadow: ${isDark
              ? "0 12px 30px -10px rgba(0, 0, 0, 0.6)"
              : "0 12px 30px -10px rgba(15, 23, 42, 0.1)"} !important;
          }

          /* 🔲 Table Wrapper Custom Border */
          .ant-table-wrapper .ant-table {
            border: 1px solid ${isDark ? "#1E293B" : "#F1F5F9"} !important;
            border-radius: 12px !important;
            overflow: hidden !important;
          }

          /* 🧪 Glassmorphism Header */
          .ant-layout-header {
            backdrop-filter: blur(12px);
            position: sticky;
            top: 0;
            z-index: 1000;
            border-bottom: 1px solid ${isDark ? "#1E293B" : "#F1F5F9"} !important;
          }
        `}</style>
        {children}
      </App>
    </ConfigProvider>
  );
}
