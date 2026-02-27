import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: {
    default: "ระบบช่วยเหลือ เว็บสคูลไบรท์",
    template: "%s | ระบบช่วยเหลือ เว็บสคูลไบรท์",
  },
  description: "ระบบสนับสนุนการบริหารจัดการสถานศึกษา - สคูลไบรท์ เว็บเฮลเปอร์",
  applicationName: "สคูลไบรท์ เว็บเฮลเปอร์",
  keywords: [
    "สคูลไบรท์",
    "เว็บเฮลเปอร์",
    "ระบบจัดการโรงเรียน",
    "ระบบบริหารสถานศึกษา",
  ],
  authors: [{ name: "หัวหน้าฝ่ายเทคโนโลยี", url: "https://schoolbright.co" }],
  creator: "สคูลไบรท์",
  publisher: "ทีมพัฒนาเทคโนโลยี สคูลไบรท์",
  other: {
    "mobile-web-app-capable": "ใช่",
    "apple-mobile-web-app-capable": "ใช่",
    "apple-mobile-web-app-status-bar-style": "ดำโปร่งใส",
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

export const viewport: Viewport = {
  themeColor: "#F97316",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
};
