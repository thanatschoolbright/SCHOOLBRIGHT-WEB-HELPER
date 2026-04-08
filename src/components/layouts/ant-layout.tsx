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
    bgLayout: "#0F172A", // Slate 900 (Brighter than previous Slate 950)
    bgContainer: "#1E293B", // Slate 800
    bgElevated: "#334155", // Slate 700
    textMain: "#FFFFFF", // Max contrast pure white
    textSub: "#CBD5E1", // Brighter secondary text (Slate 300)
    border: "#334155", // More visible border (Slate 700)
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
        borderRadius: 999, // Perfect Capsule Shape
        defaultShadow: "0 2px 0 rgba(0, 0, 0, 0.02)",
        primaryShadow: "0 4px 12px rgba(255, 140, 0, 0.25)",
        contentFontSize: 14,
        paddingBlock: 8,
      },
      Card: {
        paddingLG: 24,
        colorBgContainer: isDark
          ? "rgba(30, 41, 59, 0.75)"
          : "rgba(255, 255, 255, 0.85)",
        colorBorderSecondary: isDark
          ? "rgba(71, 85, 105, 0.5)"
          : "rgba(226, 232, 240, 0.8)",
        boxShadowTertiary: isDark
          ? "0 1px 3px rgba(0,0,0,0.2), 0 8px 24px -4px rgba(0,0,0,0.35)"
          : "0 1px 3px rgba(0,0,0,0.04), 0 8px 24px -4px rgba(0,0,0,0.07)",
        headerBg: "transparent",
        headerFontSize: 15,
        headerFontSizeSM: 13,
      },
      Table: {
        headerBg: isDark ? "#334155" : "#F8FAFC", // Brighter table header
        headerSplitColor: "transparent",
        headerBorderRadius: 16,
        padding: 16,
      },
      Input: {
        activeShadow: "0 0 0 2px rgba(255, 140, 0, 0.1)",
        colorBgContainer: isDark ? "rgba(15, 23, 42, 0.6)" : "#FFFFFF", // Brighter input background
      },
      Select: {
        controlOutline: "none",
      },

      Modal: {
        contentBg: isDark ? "#1E293B" : "#FFFFFF",
        headerBg: isDark ? "#1E293B" : "#FFFFFF",
        footerBg: isDark ? "#1E293B" : "#FFFFFF",
        titleColor: isDark ? "#F8FAFC" : "#0F172A",
        titleFontSize: 16,
        borderRadiusLG: 24,
      },

      Menu: {
        itemBorderRadius: 12,
        activeBarBorderWidth: 0,
        subMenuItemBg: "transparent",
      },

      Timeline: {
        tailColor: isDark ? "#475569" : "#CBD5E1",
        tailWidth: 2,
        dotBorderWidth: 3,
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

  // ConfigProvider ต้องครอบ children ตั้งแต่แรก เพื่อให้ locale={thTH} ถูก apply
  // ก่อน DatePicker / component ต่างๆ mount (ถ้าไม่ทำ locale จะติดค่า default ภาษาอังกฤษ)
  return (
    <ConfigProvider
      locale={thTH}
      theme={isMounted ? themeConfig : undefined}
      componentSize="middle"
      input={{ autoComplete: "off" }}
    >
      <App>
        <div
          className={isMounted ? "ant-theme-root" : undefined}
          style={
            isMounted
              ? ({
                  "--primary": BRAND_COLORS.primary,
                  "--bg-layout": palette.bgLayout,
                  "--border": palette.border,
                  "--table-border": isDark
                    ? "rgba(71, 85, 105, 0.42)"
                    : "rgba(226, 232, 240, 0.85)",
                  "--text-main": palette.textMain,
                  "--glass-bg": isDark
                    ? "rgba(30, 41, 59, 0.75)"
                    : "rgba(255, 255, 255, 0.7)",
                  "--card-glass-bg": isDark
                    ? "rgba(30, 41, 59, 0.7)"
                    : "rgba(255, 255, 255, 0.65)",
                  "--modal-mask-bg": isDark
                    ? "rgba(0, 0, 0, 0.5)"
                    : "rgba(0, 0, 0, 0.45)",
                  "--scroll-thumb": isDark ? "#334155" : "#CBD5E1",
                  "--scroll-thumb-hover": isDark ? "#475569" : "#94A3B8",
                  "--modal-bg": isDark ? "#1E293B" : "#FFFFFF",
                } as React.CSSProperties)
              : { visibility: "hidden" }
          }
        >
          {isMounted && (
            <style jsx global>{`
              :root {
                --font-family: ${FONTS[themeFont]};
              }
              body {
                background-color: var(--bg-layout);
                color: var(--text-main);
                font-family: var(--font-family);
                -webkit-font-smoothing: antialiased;
                transition: background-color 0.4s ease, color 0.4s ease;
                margin: 0;
              }

              /* ═══════════════════
                 Card — Light Mode
                 ═══════════════════ */
              .ant-card {
                background: rgba(255, 255, 255, 0.85) !important;
                backdrop-filter: blur(12px) saturate(180%) !important;
                -webkit-backdrop-filter: blur(12px) saturate(180%) !important;
                border: 1px solid rgba(226, 232, 240, 0.8) !important;
                box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04),
                  0 8px 24px -4px rgba(0, 0, 0, 0.07) !important;
                transition: box-shadow 0.3s cubic-bezier(0.25, 0.8, 0.25, 1),
                  transform 0.3s cubic-bezier(0.25, 0.8, 0.25, 1),
                  border-color 0.3s ease !important;
              }
              .ant-card:hover {
                box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05),
                  0 16px 40px -8px rgba(0, 0, 0, 0.12) !important;
                transform: translateY(-2px) !important;
                border-color: rgba(203, 213, 225, 0.9) !important;
              }

              /* Card Header — Light */
              .ant-card .ant-card-head {
                background: transparent !important;
                border-bottom: 1px solid rgba(241, 245, 249, 1) !important;
                padding-inline: 24px !important;
                min-height: 52px !important;
              }
              .ant-card .ant-card-head-title {
                font-weight: 700 !important;
                font-size: 15px !important;
                letter-spacing: -0.01em !important;
                color: #0f172a !important;
              }
              .ant-card .ant-card-extra {
                color: #64748b !important;
              }

              /* Card Actions — Light */
              .ant-card .ant-card-actions {
                background: rgba(248, 250, 252, 0.8) !important;
                border-top: 1px solid rgba(241, 245, 249, 1) !important;
              }
              .ant-card .ant-card-actions > li > span:hover {
                color: #ff8c00 !important;
              }

              /* ══════════════════
                 Card — Dark Mode
                 ══════════════════ */
              .dark .ant-card {
                background: rgba(30, 41, 59, 0.75) !important;
                border: 1px solid rgba(71, 85, 105, 0.5) !important;
                box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2),
                  0 8px 24px -4px rgba(0, 0, 0, 0.35) !important;
              }
              .dark .ant-card:hover {
                box-shadow: 0 2px 6px rgba(0, 0, 0, 0.25),
                  0 16px 40px -8px rgba(0, 0, 0, 0.5),
                  0 0 0 1px rgba(255, 140, 0, 0.08) !important;
                border-color: rgba(100, 116, 139, 0.6) !important;
                transform: translateY(-2px) !important;
              }

              /* Card Header — Dark */
              .dark .ant-card .ant-card-head {
                border-bottom-color: rgba(51, 65, 85, 0.8) !important;
              }
              .dark .ant-card .ant-card-head-title {
                color: #f1f5f9 !important;
              }
              .dark .ant-card .ant-card-extra {
                color: #94a3b8 !important;
              }

              /* Card Actions — Dark */
              .dark .ant-card .ant-card-actions {
                background: rgba(15, 23, 42, 0.4) !important;
                border-top-color: rgba(51, 65, 85, 0.8) !important;
              }
              .dark .ant-card .ant-card-actions > li > span:hover {
                color: #fb923c !important;
              }

              /* glass-card utility (manual) */
              .glass-card {
                background: var(--card-glass-bg) !important;
                backdrop-filter: blur(12px) saturate(180%) !important;
                -webkit-backdrop-filter: blur(12px) saturate(180%) !important;
                border: 1px solid var(--border) !important;
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

              /* ═══════════════
                 Timeline
                 ═══════════════ */
              .ant-timeline .ant-timeline-item-tail {
                border-inline-start: 2px solid #cbd5e1 !important;
              }
              .dark .ant-timeline .ant-timeline-item-tail {
                border-inline-start: 2px solid #475569 !important;
              }
              .ant-timeline .ant-timeline-item-head {
                background-color: transparent !important;
              }
              .ant-timeline .ant-timeline-item-head-blue {
                border-color: #ff8c00 !important;
                color: #ff8c00 !important;
              }

              /* ══════════════════════════════
                 Select — Tag / Selection Item
                 ══════════════════════════════ */
              .ant-select-selection-item {
                padding-inline-start: 10px !important;
                padding-inline-end: 6px !important;
                height: 28px !important;
                line-height: 26px !important;
                border-radius: 6px !important;
                gap: 4px !important;
              }
              .ant-select-selection-item-content {
                margin-inline-end: 6px !important;
              }
              .ant-select-selection-item-remove {
                display: flex !important;
                align-items: center !important;
                padding-inline: 4px !important;
                font-size: 11px !important;
              }

              /* Global Component Polishing */
              .ant-table-wrapper .ant-table {
                background: transparent !important;
              }
              .ant-table-wrapper .ant-table-container {
                border: 1px solid var(--table-border) !important;
                border-radius: 16px !important;
                overflow: hidden;
              }

              /* ═══════════════════════════════════════
                 Modal — Premium Styling (Light & Dark)
                 ═══════════════════════════════════════ */

              /* Blur page content when any modal/drawer is open
                 (ant-scrolling-effect is added to body by Ant Design)
                 Modal portal is appended to body OUTSIDE .ant-theme-root,
                 so only the page wrapper gets blurred — modal stays sharp */
              .ant-theme-root {
                transition: filter 0.35s cubic-bezier(0.25, 0.8, 0.25, 1),
                  transform 0.35s cubic-bezier(0.25, 0.8, 0.25, 1);
                will-change: filter;
              }
              body.ant-scrolling-effect .ant-theme-root {
                filter: blur(6px) brightness(0.9) saturate(0.8);
                transform: scale(0.99);
                pointer-events: none;
              }

              /* Overlay — hardcoded colors (CSS variables don't reach portal) */
              .ant-modal-mask {
                background: rgba(0, 0, 0, 0.3) !important;
              }
              .dark .ant-modal-mask {
                background: rgba(0, 0, 0, 0.45) !important;
              }

              /* Wrapper centering */
              .ant-modal {
                padding-block: 40px !important;
              }

              /* Content shell */
              .ant-modal-content {
                border-radius: 24px !important;
                overflow: hidden !important;
                padding: 0 !important;
                background: #ffffff !important;
                border: 1px solid #e2e8f0 !important;
                box-shadow: 0 8px 16px -4px rgba(0, 0, 0, 0.08),
                  0 24px 48px -12px rgba(0, 0, 0, 0.12) !important;
              }
              .dark .ant-modal-content {
                background: #1e293b !important;
                border: 1px solid #334155 !important;
                box-shadow: 0 8px 16px -4px rgba(0, 0, 0, 0.4),
                  0 32px 64px -16px rgba(0, 0, 0, 0.6) !important;
              }

              /* Header */
              .ant-modal-header {
                padding: 24px 28px 16px !important;
                margin-bottom: 0 !important;
                background: transparent !important;
                border-bottom: 1px solid #f1f5f9 !important;
              }
              .dark .ant-modal-header {
                border-bottom-color: #334155 !important;
              }
              .ant-modal-title {
                font-size: 16px !important;
                font-weight: 700 !important;
                letter-spacing: -0.01em !important;
                color: #0f172a !important;
              }
              .dark .ant-modal-title {
                color: #f8fafc !important;
              }

              /* Body */
              .ant-modal-body {
                padding: 20px 28px !important;
                color: #374151;
              }
              .dark .ant-modal-body {
                color: #cbd5e1 !important;
              }

              /* Footer */
              .ant-modal-footer {
                padding: 16px 28px 24px !important;
                margin-top: 0 !important;
                background: transparent !important;
                border-top: 1px solid #f1f5f9 !important;
                display: flex !important;
                justify-content: flex-end !important;
                gap: 8px !important;
              }
              .dark .ant-modal-footer {
                border-top-color: #334155 !important;
              }

              /* Close button */
              .ant-modal-close {
                top: 18px !important;
                inset-inline-end: 20px !important;
                width: 32px !important;
                height: 32px !important;
                border-radius: 50% !important;
                background: #f1f5f9 !important;
                color: #64748b !important;
                transition: all 0.2s ease !important;
              }
              .ant-modal-close:hover {
                background: #e2e8f0 !important;
                color: #0f172a !important;
                transform: rotate(90deg) !important;
              }
              .dark .ant-modal-close {
                background: rgba(51, 65, 85, 0.8) !important;
                color: #94a3b8 !important;
              }
              .dark .ant-modal-close:hover {
                background: #475569 !important;
                color: #f8fafc !important;
              }

              /* Confirm Modal icon row */
              .ant-modal-confirm-body-wrapper {
                padding: 0 !important;
              }
              .ant-modal-confirm-body {
                padding: 24px 28px 16px !important;
                display: flex !important;
                gap: 14px !important;
                align-items: flex-start !important;
              }
              .ant-modal-confirm-title {
                font-weight: 700 !important;
                font-size: 15px !important;
              }
              .ant-modal-confirm-btns {
                padding: 16px 28px 24px !important;
                border-top: 1px solid #f1f5f9 !important;
                display: flex !important;
                gap: 8px !important;
                justify-content: flex-end !important;
              }
              .dark .ant-modal-confirm-btns {
                border-top-color: #334155 !important;
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
                background: #1e293b !important;
                border-color: #475569 !important;
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
          )}
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
