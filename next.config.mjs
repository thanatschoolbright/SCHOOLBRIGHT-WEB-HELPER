/**
 * @type {import('next').NextConfig}
 */
const isProd = process.env.NODE_ENV === "production";

const nextConfig = {
  reactStrictMode: false,

  // ✅ 1. ส่วน TypeScript ยังเก็บไว้ได้ (เพื่อข้าม error ตอน build)
  typescript: {
    ignoreBuildErrors: true,
  },

  // ❌ 2. ลบส่วน ESLint ออก เพราะ Next.js 16 ไม่รองรับในไฟล์นี้แล้ว
  // ถ้าไม่ลบ Build จะพังทันที

  experimental: {
    serverActions: { bodySizeLimit: "50mb" },
    proxyClientMaxBodySize: "200mb",
    
    // ✅ ถ้า RAM เต็มจริงๆ ให้ Uncomment 2 บรรทัดล่างนี้
    // workerThreads: false,
    // cpus: 1,
  },

  images: {
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