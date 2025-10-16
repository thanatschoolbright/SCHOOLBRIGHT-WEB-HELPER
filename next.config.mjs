/** @type {import('next').NextConfig} */

const isProd = process.env.NODE_ENV === "production";

const nextConfig = {
  reactStrictMode: true,

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "userstorage.obs.ap-southeast-2.myhuaweicloud.com"
      }
    ],
  },

  // Rewrite API requests to the backend
  // async rewrites() {
  //   return [
  //     {
  //       source: "/api/:path((?!auth).*)",
  //       destination: `${process.env.BACKEND_API_URL}/:path*`,
  //     },
  //   ];
  // },

  // Custom Webpack configuration
  webpack(config, { dev }) {
    if (!dev) {
      try {
        // Dynamic import - ใช้ได้เฉพาะตอน build
        // ตอน production runtime จะใช้ built-in terser ของ Next.js
        const TerserPlugin = require('terser-webpack-plugin');

        config.optimization.minimizer.push(
            new TerserPlugin({
              terserOptions: {
                compress: {
                  drop_console: true, // Drop console logs in production
                },
              },
            })
        );
      } catch (error) {
        // ถ้าไม่มี terser-webpack-plugin ก็ skip ไป
        // Next.js จะใช้ built-in terser แทน
        console.log('Using Next.js built-in Terser optimization');
      }
    }

    return config;
  },
};

export default nextConfig;
