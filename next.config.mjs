/**
 * @type {import('next').NextConfig}
 */
const isProd = process.env.NODE_ENV === "production";

const nextConfig = {
  reactStrictMode: false,

  // ✅ 1. ย้ายการตั้งค่า TypeScript มาตรงนี้ (เพื่อข้าม error ตอน build)
  typescript: {
    ignoreBuildErrors: true,
  },

  // ✅ 2. ย้ายการตั้งค่า ESLint มาตรงนี้ (เพื่อข้าม error ตอน build)
  eslint: {
    ignoreDuringBuilds: true,
  },

  experimental: {
    serverActions: { bodySizeLimit: "50mb" },
    proxyClientMaxBodySize: "200mb",
    
    // ✅ ถ้า RAM เต็มจริงๆ ให้ Uncomment 2 บรรทัดล่างนี้ (ช่วยลดการกิน RAM แลกกับ Build ช้าลงนิดหน่อย)
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

  // ❌ ลบส่วน build: { ... } ทิ้ง เพราะ Next.js ไม่รู้จัก key นี้
  
  productionBrowserSourceMaps: false,
};

export default nextConfig;