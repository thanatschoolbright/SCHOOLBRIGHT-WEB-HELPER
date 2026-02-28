/* eslint-disable react/no-unknown-property */
"use client";

import type { ThemeConfig } from "antd";
import { App, ConfigProvider, theme } from "antd";
import thTH from "antd/locale/th_TH";
import dayjs from "dayjs";
import "dayjs/locale/th";
import buddhistEra from "dayjs/plugin/buddhistEra";
import React, { useEffect, useMemo, useState } from "react";
import { FontProvider, useFont } from "../providers/font-provider";

// Initialize configuration
dayjs.extend(buddhistEra);
dayjs.locale("th");

/**
 * Design Constants for 2026 Aesthetics
 */
const BRAND_COLORS = {
  primary: "#FF8C00", // School Bright Orange
  success: "#10B981", // Emerald
  warning: "#F59E0B", // Amber
  error: "#EF4444", // Rose
  info: "#3B82F6", // Blue
};

const FONTS = {
  "google-sans":
    'var(--font-google-sans), "Google Sans", system-ui, sans-serif',
  sukhumvit: 'var(--font-sukhumvit), "Sukhumvit Set", system-ui, sans-serif',
};

const SYSTEM_PALETTE = {
  light: {
    bgLayout: "#F8FAFC",
    bgContainer: "#FFFFFF",
    bgElevated: "#FFFFFF",
    textMain: "#0F172A",
    textSub: "#64748B",
    border: "#F1F5F9",
    borderSecondary: "#F8FAFC",
  },
  dark: {
    bgLayout: "#020617",
    bgContainer: "#0F172A",
    bgElevated: "#1E293B",
    textMain: "#F8FAFC",
    textSub: "#94A3B8",
    border: "#1E293B",
    borderSecondary: "#1E293B",
  },
};

/**
 * Custom hook to detect system/document dark mode via MutationObserver
 */
const useThemeDetector = (): boolean => {
  const [isDark, setIsDark] = useState<boolean>(false);

  useEffect(() => {
    const checkDark = () => {
      setIsDark(document.documentElement.classList.contains("dark"));
    };
    checkDark();

    const observer = new MutationObserver(checkDark);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => {
      observer.disconnect();
    };
  }, []);

  return isDark;
};

/**
 * Generates the Ant Design theme configuration based on design system
 */
const getModernTheme = (
  isDark: boolean,
  font: keyof typeof FONTS,
): ThemeConfig => {
  const palette = isDark ? SYSTEM_PALETTE.dark : SYSTEM_PALETTE.light;

  return {
    algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm,
    token: {
      colorPrimary: BRAND_COLORS.primary,
      colorSuccess: BRAND_COLORS.success,
      colorWarning: BRAND_COLORS.warning,
      colorError: BRAND_COLORS.error,
      colorInfo: BRAND_COLORS.info,

      colorBgLayout: palette.bgLayout,
      colorBgContainer: palette.bgContainer,
      colorBgElevated: palette.bgElevated,

      colorTextBase: palette.textMain,
      colorTextSecondary: palette.textSub,

      colorBorder: palette.border,
      colorBorderSecondary: palette.borderSecondary,

      fontFamily: FONTS[font] || FONTS["google-sans"],
      fontSize: 14,
      borderRadius: 14,
      borderRadiusLG: 20,
      borderRadiusSM: 8,

      controlHeight: 44,
      fontWeightStrong: 700,

      wireframe: false,
      motionUnit: 0.1,
    },
    components: {
      Button: {
        controlOutline: "none",
        fontWeight: 600,
        paddingInlineLG: 32,
        borderRadius: 12,
        defaultShadow: "none",
        primaryShadow: "0 4px 12px rgba(255, 140, 0, 0.25)",
      },
      Card: {
        paddingLG: 24,
        colorBgContainer: isDark
          ? "rgba(15, 23, 42, 0.65)"
          : "rgba(255, 255, 255, 0.75)",
        boxShadowTertiary: isDark
          ? "0 4px 24px -2px rgba(0, 0, 0, 0.4)"
          : "0 4px 24px -2px rgba(0, 0, 0, 0.04)",
      },
      Table: {
        headerBg: isDark ? "#1E293B" : "#F8FAFC",
        headerSplitColor: "transparent",
        headerBorderRadius: 16,
        padding: 16,
      },
      Input: {
        activeShadow: "0 0 0 2px rgba(255, 140, 0, 0.1)",
        colorBgContainer: isDark ? "rgba(2, 6, 23, 0.5)" : "#FFFFFF",
      },
      Select: {
        controlOutline: "none",
      },
      Modal: {
        borderRadiusLG: 24,
        paddingLG: 32,
        headerBg: "transparent",
        contentBg: isDark ? "#1E293B" : "#FFFFFF",
      },
      Menu: {
        itemBorderRadius: 12,
        activeBarBorderWidth: 0,
        subMenuItemBg: "transparent",
      },
    },
  };
};

function ThemeInner({ children }: { children: React.ReactNode }) {
  const isDark = useThemeDetector();
  const { fontFamily: fontFromContext } = useFont();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMounted(true);
  }, []);

  const themeFont =
    (fontFromContext as keyof typeof FONTS | undefined) ?? "google-sans";
  const themeConfig = useMemo(
    () => getModernTheme(isDark, themeFont),
    [isDark, themeFont],
  );
  const palette = isDark ? SYSTEM_PALETTE.dark : SYSTEM_PALETTE.light;

  if (!isMounted) {
    return <div style={{ visibility: "hidden" }}>{children}</div>;
  }

  return (
    <ConfigProvider
      locale={thTH}
      theme={themeConfig}
      componentSize="middle"
      input={{ autoComplete: "off" }}
    >
      <App>
        <div
          className="ant-theme-root"
          style={
            {
              "--primary": BRAND_COLORS.primary,
              "--bg-layout": palette.bgLayout,
              "--border": palette.border,
              "--text-main": palette.textMain,
              "--glass-bg": isDark
                ? "rgba(15, 23, 42, 0.7)"
                : "rgba(255, 255, 255, 0.7)",
              "--card-glass-bg": isDark
                ? "rgba(15, 23, 42, 0.65)"
                : "rgba(255, 255, 255, 0.65)",
              "--modal-mask-bg": isDark
                ? "rgba(0, 0, 0, 0.6)"
                : "rgba(0, 0, 0, 0.45)",
              "--scroll-thumb": isDark ? "#1E293B" : "#CBD5E1",
              "--scroll-thumb-hover": isDark ? "#334155" : "#94A3B8",
              "--modal-bg": isDark ? "#1E293B" : "#FFFFFF",
            } as React.CSSProperties
          }
        >
          <style jsx global>{`
            :root {
              --font-family: ${FONTS[themeFont]};
            }
            body {
              background-color: var(--bg-layout);
              color: var(--text-main);
              font-family: var(--font-family);
              -webkit-font-smoothing: antialiased;
              transition:
                background-color 0.4s ease,
                color 0.4s ease;
              margin: 0;
            }

            /* Modern Glassmorphism Utilities */
            .ant-card,
            .glass-card {
              background: var(--card-glass-bg) !important;
              backdrop-filter: blur(1rem) saturate(180%) !important;
              -webkit-backdrop-filter: blur(1rem) saturate(180%) !important;
              border: 1px solid var(--border);
              box-shadow: 0 4px 20px -4px rgba(0, 0, 0, 0.03) !important;
            }
            .dark .ant-card,
            .dark .glass-card {
              border-color: var(--border) !important;
              box-shadow: 0 4px 20px -4px rgba(0, 0, 0, 0.2) !important;
            }

            .glass-header {
              background: var(--glass-bg) !important;
              backdrop-filter: blur(1rem) saturate(180%);
              -webkit-backdrop-filter: blur(1rem) saturate(180%);
              border-bottom: 1px solid var(--border);
            }

            /* Custom Transitions for Premium Feel */
            .ant-btn,
            .ant-card,
            .ant-input,
            .ant-select {
              transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1) !important;
            }

            .ant-card:hover {
              transform: translateY(-4px);
              box-shadow: 0 12px 32px -8px rgba(0, 0, 0, 0.1) !important;
            }
            .dark .ant-card:hover {
              box-shadow: 0 12px 32px -8px rgba(0, 0, 0, 0.4) !important;
            }

            /* Scrollbar Refinement */
            ::-webkit-scrollbar {
              width: 10px;
              height: 10px;
            }
            ::-webkit-scrollbar-track {
              background: transparent;
            }
            ::-webkit-scrollbar-thumb {
              background: var(--scroll-thumb);
              border-radius: 10px;
              border: 3px solid var(--bg-layout);
            }
            ::-webkit-scrollbar-thumb:hover {
              background: var(--scroll-thumb-hover);
            }

            /* Global Component Polishing */
            .ant-table-wrapper .ant-table {
              background: transparent !important;
            }
            .ant-table-wrapper .ant-table-container {
              border: 1px solid var(--border) !important;
              border-radius: 16px !important;
              overflow: hidden;
            }

            /* Premium Modal Glassmorphism & Perfect Centering */
            .ant-modal {
              padding-top: 40px !important;
              padding-bottom: 40px !important;
            }
            .ant-modal-mask {
              backdrop-filter: blur(1rem) !important;
              background: var(--modal-mask-bg) !important;
            }
            .ant-modal-content {
              background: var(--modal-bg) !important;
              backdrop-filter: none !important;
              -webkit-backdrop-filter: none !important;
              border: 1px solid var(--border-secondary) !important;
              box-shadow: 0 20px 40px -12px rgba(0, 0, 0, 0.1) !important;
            }
            .dark .ant-modal-content {
              background: #1e293b !important;
              border: 1px solid #334155;
              box-shadow: 0 24px 48px -12px rgba(0, 0, 0, 0.5) !important;
            }

            .ant-modal-content {
              background: #fcfcfd !important;
              border: 1px solid #f8fafc !important;
              box-shadow: 0 12px 32px -4px rgba(0, 0, 0, 0.04) !important;
            }

            /* Fix Body Scroll Lock for Modal and Drawer */
            body.ant-scrolling-effect {
              overflow: hidden !important;
              touch-action: none;
              -ms-touch-action: none;
            }

            /* Apple Store Connect Style Drawer */
            .ant-drawer-mask {
              background: transparent !important;
              backdrop-filter: none !important;
            }
            .ant-drawer-content-wrapper {
              padding: 24px !important;
              box-sizing: border-box !important;
              background: transparent !important;
              box-shadow: none !important;
            }
            .ant-drawer-content {
              border-radius: 20px !important;
              overflow: hidden !important;
              background: #fcfcfd !important;
              backdrop-filter: none !important;
              -webkit-backdrop-filter: none !important;
              border: 1px solid #e2e8f0 !important;
              box-shadow: none !important;
            }
            .dark .ant-drawer-content {
              background: #1c1c1e !important;
              border-color: #334155 !important;
              box-shadow: none !important;
            }
            .ant-drawer-header-title {
              display: flex !important;
              flex-direction: row-reverse !important;
              justify-content: space-between !important;
              width: 100% !important;
            }
            .ant-drawer-close {
              margin-inline-end: 0 !important;
              margin-inline-start: auto !important;
            }
          `}</style>
          {children}
        </div>
      </App>
    </ConfigProvider>
  );
}

export default function AntDesignThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <FontProvider>
      <ThemeInner>{children}</ThemeInner>
    </FontProvider>
  );
}
