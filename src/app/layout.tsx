import { AntdRegistry } from "@ant-design/nextjs-registry";
import AntThemeProvider from "@components/layouts/ant-layout";
import ThemeCustomizer from "@components/layouts/theme-customizer";
import CombinedProviders from "@components/providers/client-providers";
import React from "react";
import { Toaster } from "sonner";

import "@styles/globals.css";

import {
  anuphanFont,
  googleSansFont,
  kanitFont,
  lineSeedFont,
  sukhumvitFont,
} from "./fonts";
export { metadata, viewport } from "./metadata";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th" suppressHydrationWarning>
      <head>
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
        className={`${googleSansFont.variable} ${sukhumvitFont.variable} ${anuphanFont.variable} ${kanitFont.variable} ${lineSeedFont.variable} font-sans antialiased text-slate-900 dark:text-slate-50 min-h-screen bg-slate-50 dark:bg-[#0a0a0a] relative`}
      >
        {/* Abstract Premium Background Shapes */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
          <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full bg-blue-500/10 blur-[120px] dark:bg-blue-600/5 animate-pulse" />
          <div className="absolute top-[20%] -right-[5%] w-[35%] h-[35%] rounded-full bg-purple-500/10 blur-[120px] dark:bg-purple-600/5" />
          <div className="absolute -bottom-[10%] left-[20%] w-[30%] h-[30%] rounded-full bg-indigo-500/10 blur-[120px] dark:bg-indigo-600/5" />
        </div>

        <div className="min-h-screen w-full bg-white/90 dark:bg-[#141414]/90 backdrop-blur-xl relative z-10">
          <AntdRegistry>
            <Toaster
              position="bottom-center"
              richColors
              closeButton
              visibleToasts={5}
              duration={5000}
              offset={24}
            />
            <AntThemeProvider>
              <CombinedProviders>{children}</CombinedProviders>
              <ThemeCustomizer />
            </AntThemeProvider>
          </AntdRegistry>
        </div>
      </body>
    </html>
  );
}
