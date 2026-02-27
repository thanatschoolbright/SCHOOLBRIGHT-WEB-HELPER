import { AntdRegistry } from "@ant-design/nextjs-registry";
import AntThemeProvider from "@components/layouts/ant-layout";
import CopyrightToggle from "@components/layouts/copyright-toggle";
import ThemeCustomizer from "@components/layouts/theme-customizer";
import CombinedProviders from "@components/providers/client-providers";
import React from "react";
import { Toaster } from "sonner";

import "@styles/globals.css";

import { googleSansFont, sukhumvitFont } from "./fonts";
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
        className={`${googleSansFont.variable} ${sukhumvitFont.variable} font-sans antialiased text-slate-900 dark:text-slate-50`}
      >
        <AntdRegistry>
          <Toaster
            position="bottom-right"
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
          <CopyrightToggle />
        </AntdRegistry>
      </body>
    </html>
  );
}
