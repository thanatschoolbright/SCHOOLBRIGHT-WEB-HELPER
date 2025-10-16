"use client";
import React, {useEffect, useMemo, useState} from "react";
import {ConfigProvider, theme} from "antd";
import thTH from "antd/locale/th_TH";
import "dayjs/locale/th";
import dayjs from "dayjs";

dayjs.locale("th");

export default function AntThemeProvider({
                                             children,
                                         }: {
    children: React.ReactNode;
}) {
    const [isDark, setIsDark] = useState(false);

    useEffect(() => {
        // ตรวจจับการเปลี่ยน class ของ Tailwind (dark mode)
        const observer = new MutationObserver(() => {
            setIsDark(document.documentElement.classList.contains("dark"));
        });

        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ["class"],
        });

        // set state ตอน mount
        setIsDark(document.documentElement.classList.contains("dark"));

        return () => observer.disconnect();
    }, []);

    const palette = useMemo(() => {
        if (isDark) {
            return {
                primary: "#ff8a50",
                primaryHover: "#ffa06f",
                primaryActive: "#ff7a3a",
                backgroundBase: "#141414",
                backgroundElevated: "#1f1f1f",
                backgroundMuted: "#2a2a2a",
                border: "#303030",
                textPrimary: "rgba(255,255,255,0.88)",
                textSecondary: "rgba(255,255,255,0.65)",
                modalMask: "rgba(0,0,0,0.55)",
            } as const;
        }

        // Light: minimal, neutral canvas with a warm primary accent
        return {
            primary: "#ff7a45", // Ant Orange 6
            primaryHover: "#ff8f5f",
            primaryActive: "#e86b37",
            backgroundBase: "#f5f7fa", // clean neutral canvas
            backgroundElevated: "#ffffff",
            backgroundMuted: "#f1f5f9", // subtle neutral fill
            border: "#e5e7eb", // neutral border
            textPrimary: "#0f172a",
            textSecondary: "rgba(15,23,42,0.65)",
            modalMask: "rgba(15,23,42,0.35)",
        } as const;
    }, [isDark]);

    const themeTokens = useMemo(
        () => ({
            algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm,
            token: {
                colorPrimary: palette.primary,
                colorPrimaryHover: palette.primaryHover,
                colorPrimaryActive: palette.primaryActive,
                colorPrimaryBorder: palette.border,
                colorPrimaryBg: `${palette.primary}14`,
                colorPrimaryBgHover: `${palette.primary}20`,
                colorText: palette.textPrimary,
                colorTextSecondary: palette.textSecondary,
                colorTextTertiary: isDark
                    ? "rgba(255,255,255,0.45)"
                    : "rgba(60,47,36,0.45)",
                colorLink: palette.primary,
                colorLinkHover: palette.primaryHover,
                colorBorder: palette.border,
                colorBorderSecondary: palette.border,
                colorBgBase: palette.backgroundBase,
                colorBgLayout: palette.backgroundBase,
                colorBgContainer: palette.backgroundElevated,
                colorBgElevated: palette.backgroundElevated,
                colorFillSecondary: palette.backgroundMuted,
                colorBgMask: palette.modalMask,
                borderRadius: 18,
                borderRadiusLG: 22,
                borderRadiusSM: 14,
                fontFamily: "Sukhumvit, -apple-system, BlinkMacSystemFont, sans-serif",
                controlHeight: 44,
                controlHeightLG: 50,
                controlHeightSM: 36,
                fontSize: 15,
                sizeStep: 4,
                padding: 14,
                colorSuccess: "#18c964",
                colorWarning: "#ffb347",
                colorError: "#ff5c4d",
            },
            components: {
                Layout: {
                    headerBg: "transparent",
                    bodyBg: palette.backgroundBase,
                    siderBg: palette.backgroundElevated,
                },
                Button: {
                    borderRadius: 12,
                    controlHeight: 48,
                    fontWeight: 500,
                    boxShadow: isDark
                        ? "0 6px 16px rgba(0,0,0,0.35)"
                        : "0 6px 16px rgba(15,23,42,0.06)",
                    defaultColor: palette.textPrimary,
                    defaultBg: palette.backgroundElevated,
                    defaultBorderColor: palette.border,
                    colorBgTextHover: `${palette.primary}12`,
                    colorBgTextActive: `${palette.primary}18`,
                },
                Input: {
                    borderRadius: 12,
                    controlHeight: 44,
                    colorBgContainer: palette.backgroundElevated,
                    colorBorder: palette.border,
                    activeShadow: `0 0 0 2px ${palette.primary}26`,
                },
                Select: {
                    borderRadius: 12,
                    controlHeight: 44,
                    colorBgContainer: palette.backgroundElevated,
                    colorBorder: palette.border,
                    optionSelectedBg: `${palette.primary}26`,
                },
                DatePicker: {
                    borderRadius: 12,
                    colorBgContainer: palette.backgroundElevated,
                    colorBorder: palette.border,
                    cellHoverBg: `${palette.primary}1a`,
                    cellActiveWithRangeBg: `${palette.primary}30`,
                },
                Card: {
                    // Header Section

                    // Body Section
                    padding: 24, // ✅ ระยะห่างภายในของ body (ค่าเริ่มต้น 24)
                    fontSize: 16, // ✅ ขนาดตัวอักษรใน body
                    colorBgContainer: palette.backgroundElevated, // ✅ สีพื้นหลังของ card body
                    colorText: palette.textPrimary, // ✅ สีข้อความใน body
                    colorBorderSecondary: palette.border, // ✅ สีเส้นขอบ (body-border)

                    // Common Style
                    borderRadiusLG: 18,
                    borderRadiusSM: 14,
                    boxShadow: isDark
                        ? "0 12px 24px rgba(0,0,0,0.35)"
                        : "0 6px 16px rgba(15,23,42,0.06)",

                },
                Modal: {
                    borderRadiusLG: 14,
                    colorBgElevated: palette.backgroundElevated,
                    headerBg: palette.backgroundElevated,
                    titleFontSize: 20,
                    boxShadow: isDark
                        ? "0 28px 60px rgba(0,0,0,0.55)"
                        : "0 12px 32px rgba(15,23,42,0.08)",
                },
                Table: {
                    borderRadius: 12,

                    // Header styling - ปรับให้โดดเด่นกว่าเดิม
                    headerBg: isDark ? "rgba(255, 255, 255, 0.08)" : "#f1f5f9",
                    headerColor: isDark ? "rgba(255, 255, 255, 0.95)" : "#0f172a",
                    headerSplitColor: "transparent",
                    headerSortActiveBg: isDark ? "rgba(255, 255, 255, 0.12)" : "#e2e8f0",
                    headerSortHoverBg: isDark ? "rgba(255, 255, 255, 0.12)" : "#e2e8f0",

                    // Row styling
                    rowHoverBg: isDark ? "rgba(255, 255, 255, 0.04)" : "rgba(0, 0, 0, 0.02)",
                    rowSelectedBg: isDark ? "rgba(24, 144, 255, 0.15)" : "rgba(24, 144, 255, 0.08)",
                    rowSelectedHoverBg: isDark ? "rgba(24, 144, 255, 0.2)" : "rgba(24, 144, 255, 0.12)",

                    // Background
                    colorBgContainer: palette.backgroundElevated,

                    // Border styling
                    borderColor: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.06)",

                    // Cell padding
                    cellPaddingBlock: 16,
                    cellPaddingInline: 16,

                    // Font
                    cellFontSize: 14,
                    headerFontSize: 14,

                    // Filter dropdown
                    filterDropdownBg: palette.backgroundElevated,
                    filterDropdownMenuBg: palette.backgroundElevated,

                    // Footer
                    footerBg: isDark ? "rgba(255, 255, 255, 0.02)" : "#fafafa",
                    footerColor: palette.textSecondary,
                },
                Dropdown: {
                    borderRadiusLG: 12,
                    colorBgElevated: palette.backgroundElevated,
                    controlItemBgHover: `${palette.primary}10`,
                    controlItemBgActive: `${palette.primary}16`,
                },
                Tag: {
                    borderRadiusSM: 12,
                    defaultBg: `${palette.primary}12`,
                    defaultColor: palette.primary,
                },
                Tooltip: {
                    colorBgDefault: isDark ? "rgba(0,0,0,0.85)" : "rgba(15,23,42,0.92)",
                    colorTextLightSolid: "#ffffff",
                },
                Segmented: {
                    borderRadius: 18,
                    itemSelectedBg: `${palette.primary}18`,
                },
                Skeleton: {
                    colorBgBase: isDark ? "#2a2a2a" : "#eef2f6",
                    colorFill: isDark ? "#3a3a3a" : "#e5eaf0",
                },
            },
        }),
        [isDark, palette]
    );

    return (
        <ConfigProvider locale={thTH} theme={themeTokens as any}>
            {children}
        </ConfigProvider>
    );
}
