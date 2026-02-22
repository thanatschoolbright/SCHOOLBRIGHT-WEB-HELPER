import { AntdRegistry } from "@ant-design/nextjs-registry";
import AntThemeProvider from "@components/layouts/ant-layout";
import CopyrightToggle from "@components/layouts/copyright-toggle";
import ThemeCustomizer from "@components/layouts/theme-customizer";
import CombinedProviders from "@components/providers/client-providers";
import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import React from "react";
import { Toaster } from "sonner";

// Styles
import "@styles/globals.css";

/**
 * 🖋️ ลงทะเบียน Google Sans Font (Next.js Best Practice)
 */
const googleSansFont = localFont({
  src: [
    {
      path: "../../public/fonts/google_sans/GoogleSans-Regular.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/fonts/google_sans/GoogleSans-Medium.ttf",
      weight: "500",
      style: "normal",
    },
    {
      path: "../../public/fonts/google_sans/GoogleSans-SemiBold.ttf",
      weight: "600",
      style: "normal",
    },
    {
      path: "../../public/fonts/google_sans/GoogleSans-Bold.ttf",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-google-sans",
  display: "swap",
});

/**
 * �️ ลงทะเบียน Sukhumvit Set Font
 */
const sukhumvitFont = localFont({
  src: [
    {
      path: "../../public/fonts/sukhumvit/Sukhumvit-Set_Thin.ttf",
      weight: "100",
      style: "normal",
    },
    {
      path: "../../public/fonts/sukhumvit/Sukhumvit-Set_Light.ttf",
      weight: "300",
      style: "normal",
    },
    {
      path: "../../public/fonts/sukhumvit/Sukhumvit-Set_Text.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/fonts/sukhumvit/Sukhumvit-Set_Medium.ttf",
      weight: "500",
      style: "normal",
    },
    {
      path: "../../public/fonts/sukhumvit/Sukhumvit-Set_SemiBold.ttf",
      weight: "600",
      style: "normal",
    },
    {
      path: "../../public/fonts/sukhumvit/Sukhumvit-Set_Bold.ttf",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-sukhumvit",
  display: "swap",
});

/**
 * �📑 Next.js Metadata (Best Practice)
 */
export const metadata: Metadata = {
  title: {
    default: "SchoolBright Web Helper",
    template: "%s | SchoolBright Web Helper",
  },
  description: "ระบบช่วยเหลือการจัดการโรงเรียน - SchoolBright Web Helper",
  applicationName: "SchoolBright Web Helper",
  keywords: [
    "SchoolBright",
    "Web Helper",
    "ระบบจัดการโรงเรียน",
    "Educational System",
  ],
  authors: [
    { name: "Head of Technology Light", url: "https://schoolbright.co" },
  ],
  creator: "Light",
  publisher: "SchoolBright Development Team",
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black-translucent",
  },
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/manifest.json",
};

/**
 * 📱 Viewport Configurations
 */
export const viewport: Viewport = {
  themeColor: "#F97316",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
};

/**
 * 🏗️ RootLayout - โครงสร้างพื้นฐานของระบบ (Next.js App Router)
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th" suppressHydrationWarning>
      <head>
        {/* Anti-FOUC Theme Script (Inline for Speed) */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var savedMode = localStorage.getItem('theme');
                  var prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  var theme = savedMode || (prefersDarkMode ? 'dark' : 'light');

                  if (theme === 'dark') {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
        {/* Resource Hints */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        <link rel="dns-prefetch" href="https://fonts.gstatic.com" />
      </head>
      <body
        suppressHydrationWarning
        className={`${googleSansFont.variable} ${sukhumvitFont.variable} font-sans antialiased text-slate-900 dark:text-slate-50`}
      >
        <AntdRegistry>
          {/* Sonner Toaster - ระบบแจ้งเตือน */}
          <Toaster
            position="bottom-right"
            richColors
            closeButton
            visibleToasts={5}
            duration={5000}
            offset={24}
          />

          {/* 🎨 Theme & Multi-Provider Wrapper */}
          <AntThemeProvider>
            <CombinedProviders>{children}</CombinedProviders>
            <ThemeCustomizer />
          </AntThemeProvider>

          {/* แถบข้อมูล Copyright โปร่งแสง */}
          <CopyrightToggle />
        </AntdRegistry>
      </body>
    </html>
  );
}
