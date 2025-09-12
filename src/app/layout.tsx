// app/layout.tsx
import "@styles/font.css";
import "@styles/globals.css";
import ClientProvider from "@components/providers/client-providers";
import LocaleProvider from "@components/providers/i18n-provider";
import SchoolReduxProvider from "@components/providers/school-list-provider";
import AuthenticationReduxProvider from "@/components/providers/auth-provider";
import { Toaster } from "sonner";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Favicon */}
        <link rel="icon" href="/favicon-32x32.png" sizes="32x32" />
        <link rel="icon" href="/favicon-16x16.png" sizes="16x16" />
        <link rel="shortcut icon" href="/favicon.ico" />

        {/* Apple Touch Icon */}
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />

        {/* PWA */}
        <meta name="application-name" content="My Web App" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="My Web App" />
        <meta name="description" content="This is my awesome web app." />
        <meta name="theme-color" content="#4A90E2" />

        {/* PWA Manifest */}
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className="font-lineseed antialiased">
        <Toaster richColors position="top-right" closeButton />
        <ClientProvider>
          <LocaleProvider locale="en" />
          <AuthenticationReduxProvider>
            <SchoolReduxProvider>{children}</SchoolReduxProvider>
          </AuthenticationReduxProvider>
        </ClientProvider>
      </body>
    </html>
  );
}
