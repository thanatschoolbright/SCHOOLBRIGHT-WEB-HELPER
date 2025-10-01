"use client";
import React, { useEffect, useMemo, useState } from "react";
import { ConfigProvider, theme } from "antd";
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
        primary: "#ff9552",
        primaryHover: "#ffad78",
        primaryActive: "#ff7f33",
        backgroundBase: "#1d1d1f",
        backgroundElevated: "rgba(36,36,39,0.92)",
        backgroundMuted: "rgba(255,149,82,0.12)",
        border: "rgba(255,149,82,0.28)",
        textPrimary: "rgba(255,255,255,0.88)",
        textSecondary: "rgba(255,255,255,0.65)",
        modalMask: "rgba(10,10,12,0.78)",
      } as const;
    }

    return {
      primary: "#ff6f2c", // ปรับสี primary ให้เข้มขึ้นเล็กน้อยเพื่อไม่ให้กลืนกับ headerBg
      primaryHover: "#ff9d68",
      primaryActive: "#ff7129",
      backgroundBase: "#faf6f2",
      backgroundElevated: "#ffffff",
      backgroundMuted: "#ff8350",
      border: "#ffe1cc",
      textPrimary: "#3c2f24",
      textSecondary: "rgba(60,47,36,0.68)",
      modalMask: "rgba(46,30,18,0.2)",
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
        colorPrimaryBg: palette.backgroundMuted,
        colorPrimaryBgHover: palette.primaryHover,
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
        fontFamily: "Anuphan, -apple-system, BlinkMacSystemFont, sans-serif",
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
          borderRadius: 18,
          controlHeight: 44,
          fontWeight: 600,
          boxShadow: "0 10px 24px rgba(255,133,70,0.18)",
          defaultColor: palette.textPrimary,
          defaultBg: palette.backgroundElevated,
          defaultBorderColor: palette.border,
          colorBgTextHover: palette.backgroundMuted,
          colorBgTextActive: palette.primaryActive,
        },
        Input: {
          borderRadius: 18,
          controlHeight: 44,
          colorBgContainer: palette.backgroundElevated,
          colorBorder: palette.border,
          activeShadow: `0 0 0 2px ${palette.primary}26`,
        },
        Select: {
          borderRadius: 18,
          controlHeight: 44,
          colorBgContainer: palette.backgroundElevated,
          colorBorder: palette.border,
          optionSelectedBg: `${palette.primary}26`,
        },
        DatePicker: {
          borderRadius: 18,
          colorBgContainer: palette.backgroundElevated,
          colorBorder: palette.border,
          cellHoverBg: `${palette.primary}1a`,
          cellActiveWithRangeBg: `${palette.primary}30`,
        },
        Card: {
          borderRadiusLG: 26,
          borderRadiusSM: 20,
          colorBorderSecondary: "transparent",
          colorBgContainer: palette.backgroundElevated,
          boxShadow: isDark
            ? "0 18px 32px rgba(8,8,12,0.55)"
            : "0 20px 40px rgba(255,133,70,0.12)",
          headerFontSize: 18,
          headerHeight: 58,
        },
        Modal: {
          borderRadiusLG: 28,
          colorBgElevated: palette.backgroundElevated,
          headerBg: palette.backgroundElevated,
          titleFontSize: 20,
          boxShadow: isDark
            ? "0 28px 60px rgba(0,0,0,0.65)"
            : "0 24px 60px rgba(255,133,70,0.18)",
        },
        Table: {
          borderRadius: 24,
          headerBg: "#ff945c", // ปรับสีหัวตารางให้อ่อนลงเล็กน้อย
          headerColor: "#ffffff",
          rowHoverBg: `${palette.primary}12`,
          colorBgContainer: palette.backgroundElevated,
          filterDropdownBg: palette.backgroundElevated,
          filterDropdownMenuBg: palette.backgroundElevated,
          filterDropdownMenuBorderColor: palette.border,
          filterIconColor: "#ffffff",
          filterIconActiveColor: "#ffffff",
          headerSortActiveColor: "#ffffff",
          headerSortHoverColor: "#ffffff",
          headerSortActiveBg: "#ff8645",
          headerSortHoverBg: "#ff9d68",
        },
        Dropdown: {
          borderRadiusLG: 22,
          colorBgElevated: palette.backgroundElevated,
          controlItemBgHover: `${palette.primary}14`,
          controlItemBgActive: `${palette.primary}22`,
        },
        Tag: {
          borderRadiusSM: 14,
          defaultBg: `${palette.primary}18`,
          defaultColor: palette.primaryActive,
        },
        Tooltip: {
          colorBgDefault: isDark
            ? "rgba(255,255,255,0.1)"
            : "rgba(46,23,14,0.92)",
          colorTextLightSolid: isDark ? palette.textPrimary : "#fffaf5",
        },
        Segmented: {
          borderRadius: 18,
          itemSelectedBg: `${palette.primary}22`,
        },
        Skeleton: {
          colorBgBase: isDark ? "#2a2a2a" : "#f2f2f2",
          colorFill: isDark ? "#3a3a3a" : "#e0e0e0",
        },
      },
    }),
    [isDark, palette]
  );

  return (
    <ConfigProvider locale={thTH} theme={themeTokens}>
      {children}
    </ConfigProvider>
  );
}
