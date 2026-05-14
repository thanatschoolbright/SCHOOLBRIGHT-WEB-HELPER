"use client";

import type { ThemeConfig } from "antd";
import { App, ConfigProvider, theme } from "antd";
import thTH from "antd/locale/th_TH";
import dayjs from "dayjs";
import "dayjs/locale/th";
import buddhistEra from "dayjs/plugin/buddhistEra";
import relativeTime from "dayjs/plugin/relativeTime";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import React, { useEffect, useMemo, useState } from "react";
import { FontProvider, useFont } from "../providers/font-provider";

// Initialize configuration — relativeTime ต้อง extend ที่นี่เพื่อให้ .fromNow() ทำงานได้ทุก component
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(buddhistEra);
dayjs.extend(relativeTime);
dayjs.locale("th");
dayjs.tz.setDefault("Asia/Bangkok");

/**
 * Design Constants for 2026 Aesthetics
 */
const BRAND_COLORS = {
  primary: "#F97316", // Sunset Orange
  success: "#10B981", // Emerald
  warning: "#F59E0B", // Amber
  error: "#EF4444", // Rose
  info: "#3B82F6", // Blue
};

const FONTS = {
  "google-sans":
    'var(--font-google-sans), "Google Sans", system-ui, sans-serif',
  sukhumvit: 'var(--font-sukhumvit), "Sukhumvit Set", system-ui, sans-serif',
  anuphan: 'var(--font-anuphan), "Anuphan", system-ui, sans-serif',
  kanit: 'var(--font-kanit), "Kanit", system-ui, sans-serif',
  "line-seed":
    'var(--font-line-seed), "LINE Seed Sans TH", system-ui, sans-serif',
};

const SYSTEM_PALETTE = {
  light: {
    bgLayout: "#F8FAFC", // Cool Slate background (Clean)
    bgContainer: "#FFFFFF",
    bgElevated: "#FFFFFF",
    textMain: "#1E293B", // Dark Slate (Better readability)
    textSub: "#64748B",
    border: "#E2E8F0", // Slate 200 (Subtle & Modern)
    borderSecondary: "#F1F5F9",
  },
  dark: {
    bgLayout: "#0F172A",
    bgContainer: "#1E293B",
    bgElevated: "#1E293B",
    textMain: "#F8FAFC",
    textSub: "#94A3B8",
    border: "#334155",
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
      fontSize: 15,
      borderRadius: 10,
      borderRadiusLG: 16,
      borderRadiusSM: 6,

      controlHeight: 46,
      fontWeightStrong: 700,

      wireframe: false,
      motionUnit: 0.1,
    },
    components: {
      Button: {
        controlOutline: "none",
        fontWeight: 600,
        paddingInlineLG: 32,
        borderRadius: 12, // Reduced from capsule to rounded rectangle
        defaultShadow: "0 2px 0 rgba(0, 0, 0, 0.02)",
        primaryShadow: "0 4px 12px rgba(22, 119, 255, 0.15)",
        contentFontSize: 14,
        paddingBlock: 8,
      },
      Card: {
        paddingLG: 28,
        colorBgContainer: palette.bgContainer,
        colorBorderSecondary: palette.border,
        boxShadowTertiary: "none",
        headerBg: "transparent",
        headerFontSize: 16,
        headerFontSizeSM: 14,
      },
      Table: {
        headerBg: isDark ? "#1E293B" : "#F1F5F9",
        headerColor: palette.textMain,
        headerSplitColor: "transparent",
        headerBorderRadius: 12,
        padding: 16,
        colorBgContainer: palette.bgContainer,
      },
      Input: {
        activeShadow: "0 0 0 2px rgba(255, 140, 0, 0.1)",
        colorBgContainer: isDark ? "#0F172A" : "#FFFFFF",
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
        borderRadiusLG: 16,
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
      Drawer: {
        colorBgElevated: palette.bgElevated,
        colorText: palette.textMain,
        colorTextHeading: palette.textMain,
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

  const themeFont: keyof typeof FONTS =
    fontFromContext in FONTS
      ? (fontFromContext as keyof typeof FONTS)
      : "google-sans";

  // sync font ไปที่ body และ Ant Design Layout ทันทีเมื่อเปลี่ยน
  useEffect(() => {
    document.body.style.fontFamily = FONTS[themeFont];
  }, [themeFont]);

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
                --modal-bg: ${isDark ? "#1E293B" : "#FFFFFF"};
                --border: ${palette.border};
                --text-main: ${palette.textMain};
                --modal-mask-bg: ${isDark
                  ? "rgba(0, 0, 0, 0.5)"
                  : "rgba(0, 0, 0, 0.45)"};
                --font-family-current: ${FONTS[themeFont]};
              }
              body {
                background-color: var(--bg-layout);
                color: var(--text-main);
                font-family: var(--font-family-current);
                -webkit-font-smoothing: antialiased;
                transition: background-color 0.4s ease, color 0.4s ease;
                margin: 0;
              }

              /* ═══════════════════
                 Card — Light Mode
                 ═══════════════════ */
              .ant-card {
                background: #ffffff !important;
                border: 1px solid #e2e8f0 !important;
                box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.05) !important;
                transition: all 0.3s ease !important;
              }
              .ant-card:hover {
                border-color: #cbd5e1 !important;
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1) !important;
              }

              /* Card Header — Light */
              .ant-card .ant-card-head {
                background: #ffffff !important;
                border-bottom: 1px solid #f1f5f9 !important;
                padding-inline: 24px !important;
                min-height: 52px !important;
              }
              .ant-card .ant-card-head-title {
                font-weight: 600 !important;
                font-size: 15px !important;
                letter-spacing: -0.01em !important;
                color: #1e293b !important;
              }
              .ant-card .ant-card-extra {
                color: #64748b !important;
              }

              /* Card Actions — Light */
              .ant-card .ant-card-actions {
                background: #f8fafc !important;
                border-top: 1px solid #f1f5f9 !important;
              }
              .ant-card .ant-card-actions > li > span:hover {
                color: #1677ff !important;
              }

              /* ══════════════════
                 Card — Dark Mode
                 ══════════════════ */
              .dark .ant-card {
                background: #1e293b !important;
                border: 1px solid #334155 !important;
                box-shadow: none !important;
              }
              .dark .ant-card:hover {
                border-color: #475569 !important;
              }

              /* Card Header — Dark */
              .dark .ant-card .ant-card-head {
                background: #0f172a !important;
                border-bottom-color: #334155 !important;
              }
              .dark .ant-card .ant-card-head-title {
                color: #f1f5f9 !important;
              }
              .dark .ant-card .ant-card-extra {
                color: #94a3b8 !important;
              }

              /* Card Actions — Dark */
              .dark .ant-card .ant-card-actions {
                background: #0f172a !important;
                border-top-color: #334155 !important;
              }
              .dark .ant-card .ant-card-actions > li > span:hover {
                color: #fb923c !important;
              }

              /* glass-card utility (manual) */
              .glass-card {
                background: var(--modal-bg) !important;
                border: 1px solid var(--border) !important;
              }

              .glass-header {
                background: var(--bg-layout) !important;
                border-bottom: 1px solid var(--border);
              }

              /* Custom Transitions for Premium Feel */
              .ant-btn,
              .ant-card,
              .ant-input,
              .ant-select,
              .ant-menu-item,
              .ant-table-row {
                transition: all 0.3s ease !important;
              }

              /* Smooth selection color */
              ::selection {
                background: rgba(249, 115, 22, 0.2);
                color: #f97316;
              }

              /* ══════════════════════════════
                 Premium Table Refinement
                 ══════════════════════════════ */
              .ant-table-thead > tr > th {
                font-weight: 700 !important;
                text-transform: uppercase !important;
                font-size: 13px !important;
                letter-spacing: 0.05em !important;
                color: var(--text-main) !important;
                background: var(--borderSecondary) !important;
              }
              .ant-table-tbody > tr > td {
                background: var(--modal-bg) !important;
                border-bottom: 1px solid var(--border) !important;
              }
              .ant-table-tbody > tr:hover > td {
                background: var(--borderSecondary) !important;
              }
              .ant-table-cell-fix-left,
              .ant-table-cell-fix-right {
                background: var(--modal-bg) !important;
                z-index: 2;
              }
              .ant-table-tbody > tr:hover > .ant-table-cell-fix-left,
              .ant-table-tbody > tr:hover > .ant-table-cell-fix-right {
                background: var(--borderSecondary) !important;
              }
              .ant-table-row:hover {
                transform: none !important;
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
                border-color: #f97316 !important;
                color: #f97316 !important;
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
                background: var(--modal-bg) !important;
              }
              .ant-table-wrapper .ant-table-container {
                border: 1px solid var(--table-border) !important;
                border-radius: 12px !important;
                overflow: hidden;
                background: var(--modal-bg) !important;
              }

              /* ═══════════════════════════════════════
                 Modal — Premium Styling (Light & Dark)
                 ═══════════════════════════════════════ */

              /* Blur page content when any modal/drawer is open
                 (ant-scrolling-effect is added to body by Ant Design)
                 Modal portal is appended to body OUTSIDE .ant-theme-root,
                 so only the page wrapper gets blurred — modal stays sharp */
              .ant-theme-root {
                transition: transform 0.35s cubic-bezier(0.25, 0.8, 0.25, 1);
                will-change: transform;
              }
              body.ant-scrolling-effect .ant-theme-root {
                filter: none;
                transform: scale(0.99);
                pointer-events: none;
              }

              /* Overlay — hardcoded colors (CSS variables don't reach portal) */
              .ant-modal-mask {
                background: var(--modal-mask-bg) !important;
              }
              .dark .ant-modal-mask {
                background: var(--modal-mask-bg) !important;
              }

              /* Wrapper centering */
              .ant-modal {
                padding-block: 40px !important;
              }

              /* Content shell */
              .ant-modal-content {
                border-radius: 16px !important;
                overflow: hidden !important;
                padding: 0 !important;
                background: var(--modal-bg) !important;
                border: 1px solid var(--border) !important;
                box-shadow: 0 8px 16px -4px rgba(0, 0, 0, 0.08),
                  0 24px 48px -12px rgba(0, 0, 0, 0.12) !important;
              }
              .dark .ant-modal-content {
                background: var(--modal-bg) !important;
                border: 1px solid var(--border) !important;
                box-shadow: 0 8px 16px -4px rgba(0, 0, 0, 0.4),
                  0 32px 64px -16px rgba(0, 0, 0, 0.6) !important;
              }

              /* Header */
              .ant-modal-header {
                padding: 24px 28px 16px !important;
                margin-bottom: 0 !important;
                background: var(--modal-bg) !important;
                border-bottom: 1px solid var(--border) !important;
              }
              .dark .ant-modal-header {
                background: var(--modal-bg) !important;
              }
              .ant-modal-title {
                font-size: 16px !important;
                font-weight: 700 !important;
                letter-spacing: -0.01em !important;
                color: var(--text-main) !important;
              }
              .dark .ant-modal-title {
                color: var(--text-main) !important;
              }

              /* Body */
              .ant-modal-body {
                padding: 20px 28px !important;
                background: var(--modal-bg) !important;
                color: var(--text-main) !important;
              }
              .dark .ant-modal-body {
                background: var(--modal-bg) !important;
              }

              /* Footer */
              .ant-modal-footer {
                padding: 16px 28px 24px !important;
                margin-top: 0 !important;
                background: var(--modal-bg) !important;
                border-top: 1px solid var(--border) !important;
                display: flex !important;
                justify-content: flex-end !important;
                gap: 8px !important;
              }
              .dark .ant-modal-footer {
                background: var(--modal-bg) !important;
              }

              /* Close button */
              .ant-modal-close {
                top: 18px !important;
                inset-inline-end: 20px !important;
                width: 32px !important;
                height: 32px !important;
                border-radius: 50% !important;
                background: var(--border) !important;
                color: var(--text-main) !important;
                transition: all 0.2s ease !important;
              }
              .ant-modal-close:hover {
                background: var(--border) !important;
                color: var(--text-main) !important;
                transform: rotate(90deg) !important;
                opacity: 0.8;
              }
              .dark .ant-modal-close {
                background: var(--border) !important;
              }
              .dark .ant-modal-close:hover {
                background: var(--border) !important;
                opacity: 1;
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
                border-top: 1px solid var(--border) !important;
                display: flex !important;
                gap: 8px !important;
                justify-content: flex-end !important;
              }
              .dark .ant-modal-confirm-btns {
                border-top-color: var(--border) !important;
              }

              /* Fix Body Scroll Lock for Modal and Drawer */
              body.ant-scrolling-effect {
                overflow: hidden !important;
                touch-action: none;
                -ms-touch-action: none;
              }

              /* Apple Store Connect Style Drawer */
              .ant-drawer-mask {
                background: var(--modal-mask-bg) !important;
                backdrop-filter: blur(4px) !important;
                -webkit-backdrop-filter: blur(4px) !important;
              }
              .ant-drawer-content-wrapper {
                padding: 16px !important;
                box-sizing: border-box !important;
                background: transparent !important;
              }
              .ant-drawer-content {
                background: var(--modal-bg) !important;
                border-radius: 16px !important;
                border: 1px solid var(--border) !important;
                box-shadow: 0 10px 40px -10px rgba(0, 0, 0, 0.2) !important;
                overflow: hidden !important;
              }
              .ant-drawer-header {
                background: var(--modal-bg) !important;
                border-bottom: 1px solid var(--border) !important;
                padding: 20px 24px !important;
              }
              .ant-drawer-title {
                font-weight: 700 !important;
                color: var(--text-main) !important;
              }
              .ant-drawer-body {
                background: var(--modal-bg) !important;
                padding: 24px !important;
              }
              .ant-drawer-footer {
                background: var(--modal-bg) !important;
                border-top: 1px solid var(--border) !important;
                padding: 16px 24px !important;
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
