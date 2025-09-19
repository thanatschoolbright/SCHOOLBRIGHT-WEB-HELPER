"use client";
import React, { useEffect, useState } from "react";
import { ConfigProvider, theme } from "antd";

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

  return (
    <ConfigProvider
      theme={{
        algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
          colorPrimary: "#ff6b00", // School Bright Orange
          borderRadius: 10,
          fontSize: 16,
          padding: 12,
          fontFamily: "Anuphan, sans-serif",
          // ✅ ปรับพื้นหลัง layout/container ให้เหมือน Tailwind dark:bg-gray-800/40
          colorBgLayout: isDark ? "rgba(31,41,55,0.4)" : "#ffffff",
          colorBgContainer: isDark ? "rgba(31,41,55,0.4)" : "#ffffff",
        },
        components: {
          Button: {
            borderRadius: 10,
            fontSize: 16,
          },
          Input: {
            borderRadius: 10,
            fontSize: 16,
          },
          Card: {
            borderRadius: 10,
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
          },
          Modal: { borderRadius: 10 },
          Table: {
            borderRadius: 10,
            fontSize: 16,
            headerBg: isDark ? "#1f1f1f" : "#f5f5f5",
          },
          Select: {
            borderRadius: 10,
            fontSize: 16,
          },
        },
      }}
    >
      {children}
    </ConfigProvider>
  );
}
