/**
 * @type {import('next').NextConfig}
 */
const isProd = process.env.NODE_ENV === "production";

const nextConfig = {
  // --- React & Core ---
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  productionBrowserSourceMaps: false,
  output: "standalone",

  devIndicators: {
    buildActivityPosition: "bottom-left",
    buildActivity: true,
  },

  // --- Compiler & Build ---
  compiler: {
    removeConsole: isProd ? { exclude: ["error", "warn"] } : false,
    styledComponents: true, // ตรวจสอบให้แน่ใจว่าโปรเจกต์คุณใช้ Styled Components จริงๆ
  },

  typescript: {
    // Best Practice: ต้องตรวจสอบ Type เสมอก่อนขึ้น Prod
    ignoreBuildErrors: true,
  },

  // --- Images Optimization ---
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 3600,
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "userstorage.obs.ap-southeast-2.myhuaweicloud.com",
      },
    ],
  },

  // --- Experimental Features ---
  experimental: {
    // ลดขนาดลงเพื่อป้องกัน DDoS / Memory Leaks
    // หากต้องการอัปโหลดไฟล์ใหญ่ ควรใช้ Client-side direct upload (Presigned URL)
    serverActions: {
      bodySizeLimit: "5mb",
    },
    optimizePackageImports: [
      "antd",
      "@ant-design/icons",
      "lodash",
      "dayjs",
      "lucide-react",
      "framer-motion",
      "axios",
      "react-icons",
      "@tanstack/react-query",
      "fflate",
    ],
  },

  // --- Security Headers (NEW) ---
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "origin-when-cross-origin",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
