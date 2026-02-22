"use client";

import type { ThemeConfig } from "antd";
import { App, ConfigProvider, theme } from "antd";
import thTH from "antd/locale/th_TH";
import dayjs from "dayjs";
import "dayjs/locale/th";
import buddhistEra from "dayjs/plugin/buddhistEra";
import React, { useEffect, useMemo, useState } from "react";
import { FontProvider, useFont } from "../providers/font-provider";

dayjs.extend(buddhistEra);
dayjs.locale("th");

const BRAND_DESIGN_SEED_TOKENS = {
  primary: "#FF8C00",
  success: "#10B981",
  warning: "#F59E0B",
  error: "#EF4444",
  info: "#3B82F6",
  radius: 12,
  // Default font family mapping
  fonts: {
    "google-sans": 'var(--font-google-sans), "Google Sans", sans-serif',
    sukhumvit: 'var(--font-sukhumvit), "Sukhumvit Set", sans-serif',
  },
};

const SYSTEM_COLOR_PALETTE_CONFIGURATION = {
  light: {
    bgLayout: "#F9F8F6",
    bgContainer: "#FFFFFF",
    textMain: "#292524",
    textSub: "#78716C",
    border: "#E7E5E4",
  },
  dark: {
    bgLayout: "#121212",
    bgContainer: "#1E1E1E",
    textMain: "#E0E0E0",
    textSub: "#B0B0B0",
    border: "#444444",
  },
};

const useDarkModeDetector = (): boolean => {
  const [isDarkModeActive, setIsDarkModeActive] = useState(false);

  useEffect(() => {
    const checkDarkModeStatus = () => {
      setIsDarkModeActive(document.documentElement.classList.contains("dark"));
    };

    const mutationObserver = new MutationObserver(checkDarkModeStatus);

    mutationObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    checkDarkModeStatus();

    return () => {
      mutationObserver.disconnect();
    };
  }, []);

  return isDarkModeActive;
};

const generateAntDesignThemeConfiguration = (
  isDarkModeActive: boolean,
  currentFont: string,
): ThemeConfig => {
  const activeSystemColors = isDarkModeActive
    ? SYSTEM_COLOR_PALETTE_CONFIGURATION.dark
    : SYSTEM_COLOR_PALETTE_CONFIGURATION.light;

  const fontFamily =
    (BRAND_DESIGN_SEED_TOKENS.fonts as any)[currentFont] ||
    BRAND_DESIGN_SEED_TOKENS.fonts["google-sans"];

  return {
    algorithm: isDarkModeActive ? theme.darkAlgorithm : theme.defaultAlgorithm,
    token: {
      colorPrimary: BRAND_DESIGN_SEED_TOKENS.primary,
      colorSuccess: BRAND_DESIGN_SEED_TOKENS.success,
      colorWarning: BRAND_DESIGN_SEED_TOKENS.warning,
      colorError: BRAND_DESIGN_SEED_TOKENS.error,
      colorInfo: BRAND_DESIGN_SEED_TOKENS.info,
      colorBgBase: isDarkModeActive ? "#121212" : "#FFFFFF",
      colorBgLayout: activeSystemColors.bgLayout,
      colorBgContainer: activeSystemColors.bgContainer,
      colorBgElevated: isDarkModeActive ? "#242424" : "#FFFFFF",
      colorTextBase: activeSystemColors.textMain,
      colorTextSecondary: activeSystemColors.textSub,
      colorBorder: activeSystemColors.border,
      fontFamily: fontFamily,
      fontSize: 14,
      borderRadius: BRAND_DESIGN_SEED_TOKENS.radius,
      borderRadiusLG: 20,
      controlHeight: 40,
      wireframe: false,
    },
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
        colorBgContainer: isDarkModeActive ? "#1E1E1E" : "#FFFFFF",
      },
      Table: {
        headerBg: isDarkModeActive ? "#242424" : "#F5F5F4",
        headerSplitColor: "transparent",
        headerBorderRadius: 12,
      },
      Input: {
        borderRadius: 12,
        colorBgContainer: isDarkModeActive ? "#121212" : "#FFFFFF",
      },
      Select: {
        borderRadius: 12,
        colorBgContainer: isDarkModeActive ? "#121212" : "#FFFFFF",
      },
      Modal: {
        borderRadiusLG: 28,
        headerBg: isDarkModeActive ? "#1E1E1E" : "#FFFFFF",
        contentBg: isDarkModeActive ? "#1E1E1E" : "#FFFFFF",
        footerBg: isDarkModeActive ? "#1E1E1E" : "#FFFFFF",
      },
      Layout: {
        bodyBg: activeSystemColors.bgLayout,
        headerBg: isDarkModeActive
          ? "rgba(18, 18, 18, 0.85)"
          : "rgba(255, 255, 255, 0.85)",
        headerPadding: "0 24px",
      },
      Menu: {
        itemBorderRadius: 10,
        activeBarBorderWidth: 0,
      },
    },
  };
};

export function AntDesignThemeInner({
  children,
}: {
  children: React.ReactNode;
}) {
  const isDarkModeActive = useDarkModeDetector();
  const { fontFamily: currentFont } = useFont();

  const antDesignThemeConfiguration = useMemo(
    () => generateAntDesignThemeConfiguration(isDarkModeActive, currentFont),
    [isDarkModeActive, currentFont],
  );
  const activeColorPalette = isDarkModeActive
    ? SYSTEM_COLOR_PALETTE_CONFIGURATION.dark
    : SYSTEM_COLOR_PALETTE_CONFIGURATION.light;

  const cssFontFamily =
    (BRAND_DESIGN_SEED_TOKENS.fonts as any)[currentFont] ||
    BRAND_DESIGN_SEED_TOKENS.fonts["google-sans"];

  return (
    <ConfigProvider
      locale={thTH}
      theme={antDesignThemeConfiguration}
      componentSize="middle"
      input={{ autoComplete: "off" }}
    >
      <App>
        <style jsx global>{`
          body {
            background-color: ${activeColorPalette.bgLayout} !important;
            color: ${activeColorPalette.textMain};
            font-family: ${cssFontFamily};
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
            transition: background-color 0.3s ease;
          }
          ::-webkit-scrollbar {
            width: 6px;
          }
          ::-webkit-scrollbar-track {
            background: transparent;
          }
          ::-webkit-scrollbar-thumb {
            background: ${isDarkModeActive ? "#444444" : "#D6D3D1"};
            border-radius: 10px;
          }
          ::-webkit-scrollbar-thumb:hover {
            background: ${isDarkModeActive ? "#888888" : "#A8A29E"};
          }
          .ant-card {
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
            border: 1px solid ${isDarkModeActive ? "#444444" : "#E7E5E4"} !important;
          }
          .ant-card:hover {
            box-shadow: ${isDarkModeActive
              ? "0 12px 30px -10px rgba(0, 0, 0, 0.6)"
              : "0 12px 30px -10px rgba(28, 25, 23, 0.05)"} !important;
          }
          .ant-table-wrapper .ant-table {
            border: 1px solid ${isDarkModeActive ? "#444444" : "#E7E5E4"} !important;
            border-radius: 12px !important;
            overflow: hidden !important;
          }
          .ant-layout-header {
            backdrop-filter: blur(12px);
            position: sticky;
            top: 0;
            z-index: 1000;
            border-bottom: 1px solid ${isDarkModeActive ? "#444444" : "#E7E5E4"} !important;
          }
        `}</style>
        {children}
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
      <AntDesignThemeInner>{children}</AntDesignThemeInner>
    </FontProvider>
  );
}
