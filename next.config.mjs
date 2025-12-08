/** @type {import('next').NextConfig} */

const isProd = process.env.NODE_ENV === "production";

const nextConfig = {
  // ✅ ใช้ SWC Minifier ของ Next.js เอง (เร็วกว่าและกินแรมน้อยกว่า Terser)
  swcMinify: true,

  // * Enable strict mode for better development experience
  reactStrictMode: false,

  // * Configure body size limits for API routes and proxy
  experimental: {
    serverActions: { bodySizeLimit: "50mb" },
    proxyClientMaxBodySize: "200mb",

    // ✅ ส่วนนี้สำคัญมาก! สำหรับเครื่อง RAM น้อย
    // บังคับให้ทำงานแค่ Thread เดียว ไม่ให้แตก Process ลูกจนเครื่องน็อค
    workerThreads: false,
    cpus: 1,
  },

  // * Allow images from external domains
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "userstorage.obs.ap-southeast-2.myhuaweicloud.com",
      },
    ],
  },

  // * Remove console logs in production
  compiler: {
    removeConsole: isProd ? { exclude: ["error", "warn"] } : false,
  },

  // * Disable source maps in production to save Huge RAM/Disk space
  productionBrowserSourceMaps: false,

  // ✅ Ignore type checking during build to save RAM and Time
  typescript: {
    ignoreBuildErrors: true,
  },

  // ✅ Ignore ESLint during build to save RAM
  eslint: {
    ignoreDuringBuilds: true,
  },

  // ❌ ลบส่วน Webpack ที่เรียก TerserPlugin ออก
  // เพราะ Next.js มี SWC ที่จัดการเรื่องนี้ให้อยู่แล้ว การไปเพิ่ม Terser
  // จะทำให้กิน RAM เพิ่มขึ้นอีกเท่าตัวโดยไม่จำเป็น
};

export default nextConfig;
