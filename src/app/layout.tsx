import "@styles/font.css";
import "@styles/globals.css";
import {App as AntdApp} from "antd";
import ClientProvider from "@components/providers/client-providers";
import LocaleProvider from "@components/providers/i18n-provider";
import SchoolReduxProvider from "@components/providers/school-list-provider";
import AuthenticationReduxProvider from "@components/providers/auth-provider";
import AntThemeProvider from "@components/layouts/ant-layout";
import {StorageProvider} from "@components/providers/storage-provider";
import ChartProvider from "@/components/providers/chartjs-provider";
import {Toaster} from "sonner";
import type {Metadata, Viewport} from "next";

export const metadata: Metadata = {
    title: {
        default: "SchoolBright Web Helper",
        template: "%s | SchoolBright Web Helper",
    },
    description: "ระบบช่วยเหลือการจัดการโรงเรียน - SchoolBright Web Helper",
    applicationName: "SchoolBright Web Helper",
    generator: "Next.js",
    keywords: ["SchoolBright", "Web Helper", "โรงเรียน", "การศึกษา", "ระบบจัดการ"],
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
        <Toaster expand={false} richColors position="bottom-center" closeButton/>

        {/* ครอบด้วย AntdApp เพื่อให้ context ของ message, modal, notification ทำงานสมบูรณ์ */}
        <AntThemeProvider>
            <AntdApp>
                <ClientProvider>
                    <LocaleProvider locale="th">
                        <AuthenticationReduxProvider>
                            <SchoolReduxProvider>
                                <StorageProvider>
                                    <ChartProvider>{children}</ChartProvider>
                                </StorageProvider>
                            </SchoolReduxProvider>
                        </AuthenticationReduxProvider>
                    </LocaleProvider>
                </ClientProvider>
            </AntdApp>
        </AntThemeProvider>
        </body>
        </html>
    );
}
