/**
 * @type {import('next').NextConfig}
 */
const isProd = process.env.NODE_ENV === "production";

const nextConfig = {
  reactStrictMode: true, // เปิดไว้เพื่อ Best Practice และความเร็วในระยะยาว
  poweredByHeader: false,
  compress: true, // เปิดการบีบอัดไฟล์ (Gzip/Brotli)

  // ✅ 1. ส่วน TypeScript ยังเก็บไว้ได้
  typescript: {
    ignoreBuildErrors: true,
  },

  experimental: {
    serverActions: { bodySizeLimit: "50mb" },
    proxyClientMaxBodySize: "200mb",

    // ✅ Optimize Package Imports
    optimizePackageImports: [
      "antd",
      "@ant-design/icons",
      "lodash",
      "dayjs",
      "lucide-react",
      "framer-motion",
      "axios",
      "react-icons",
    ],
  },

  images: {
    minimumCacheTTL: 60, // Cache รูปภาพไว้อย่างน้อย 1 นาที
    remotePatterns: [
      {
        protocol: "https",
        hostname: "userstorage.obs.ap-southeast-2.myhuaweicloud.com",
      },
    ],
  },

  compiler: {
    removeConsole: isProd ? { exclude: ["error", "warn"] } : false,
  },

  productionBrowserSourceMaps: false,
};

export default nextConfig;
