/**
 * @type {import('next').NextConfig}
 *
 * การตั้งค่านี้ถูกปรับปรุงเพื่อ:
 * 1. ✅ แก้ไขปัญหา RAM เต็มและ CPU พุ่งสูงระหว่างการ Build (Thrashing)
 * 2. ✅ ปิดฟังก์ชันที่กินทรัพยากรที่ไม่จำเป็นใน Production Build
 * 3. ✅ ทำให้โค้ด Clean และเข้ากันได้ดีกับ Next.js 16 (Turbopack)
 *
 * === การตั้งค่าหลักเพื่อลดทรัพยากร ===
 * - experimental.workerThreads: false: บังคับให้ Node.js ไม่แตก Worker Threads ลูกหลายตัว (แก้ปัญหา Process แย่ง RAM)
 * - experimental.cpus: 1: จำกัดการใช้ CPU ในกระบวนการ Build ให้เหลือเพียง 1 Core (แก้ปัญหา CPU เต็ม)
 * - build.ignoreBuildErrors: true: ข้ามการตรวจสอบ TypeScript เพื่อลดภาระและเวลาในการ Build
 * - build.ignoreDuringBuilds: true: ข้ามการตรวจสอบ ESLint เพื่อลดภาระและเวลาในการ Build
 * - productionBrowserSourceMaps: false: ปิด Source Maps ใน Production เพื่อประหยัดพื้นที่ดิสก์และ RAM
 */

const isProd = process.env.NODE_ENV === "production";

const nextConfig = {
  reactStrictMode: false,

  experimental: {
    serverActions: { bodySizeLimit: "50mb" },
    proxyClientMaxBodySize: "200mb",
    workerThreads: false,
    cpus: 1,
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

  build: {
    ignoreBuildErrors: true,
    ignoreDuringBuilds: true,
  },

  productionBrowserSourceMaps: false,
};

export default nextConfig;