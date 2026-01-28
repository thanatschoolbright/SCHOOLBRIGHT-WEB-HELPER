import "@styles/font.css";
import "@styles/globals.css";
import { Toaster } from "sonner";
import AntThemeProvider from "@components/layouts/ant-layout";
import CombinedProviders from "@components/providers/client-providers";
import CopyrightToggle from "@components/layouts/copyright-toggle";
import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: {
    default: "SchoolBright Web Helper",
    template: "%s | SchoolBright Web Helper",
  },
  description: "ระบบช่วยเหลือการจัดการโรงเรียน - SchoolBright Web Helper",
  applicationName: "SchoolBright Web Helper",
  generator: "Next.js",
  keywords: [
    "SchoolBright",
    "Web Helper",
    "โรงเรียน",
    "การศึกษา",
    "ระบบจัดการ",
  ],
  authors: [{ name: "SchoolBright Team" }],
  creator: "SchoolBright",
  publisher: "SchoolBright",
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
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "SchoolBright Web Helper",
  },
};

export const viewport: Viewport = {
  themeColor: "#4A90E2",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th" suppressHydrationWarning>
      <head></head>
      <body className="antialiased">
        <Toaster
          expand={false}
          richColors
          position="bottom-center"
          closeButton
        />

        {/* 🎨 Theme Provider (SSR Friendly) */}
        <AntThemeProvider>
          {/* 📦 Combined Client Providers (Auth, Redux, Intl, etc.) */}
          <CombinedProviders>{children}</CombinedProviders>
        </AntThemeProvider>

        {/* Subtle copyright info icon */}
        <CopyrightToggle />
      </body>
    </html>
  );
}
