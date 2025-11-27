/** @type {import('next').NextConfig} */

const isProd = process.env.NODE_ENV === "production";

const nextConfig = {

  // * Enable strict mode for better development experience
  reactStrictMode: false,

  // * Configure body size limits for API routes and proxy
  experimental: {
    serverActions: { bodySizeLimit: '50mb' },
    proxyClientMaxBodySize: '200mb',
    // ✅ Memory Optimization for Build Process
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

  // * Remove console logs in production, keep errors and warnings
  compiler: {
    removeConsole: isProd ? { exclude: ["error", "warn"] } : false,
  },

  // * Disable source maps in production for better performance
  productionBrowserSourceMaps: false,

  // ✅ Ignore linting and type checking during build to save RAM and Time
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },

  // * Turbopack configuration for Next.js 16
  turbopack: {
    // Enable Turbopack optimizations
    rules: {},
    resolveAlias: {},
  },

  // * Custom webpack optimization for production builds (fallback for webpack mode)
  webpack(config, { dev, isServer }) {
    if (!dev && !isServer) {
      try {
        const TerserPlugin = require("terser-webpack-plugin");
        config.optimization.minimizer.push(
            new TerserPlugin({
              // terserOptions: { compress: { drop_console: true } },
            })
        );
      } catch (error) {
        // ! Fallback to Next.js built-in optimization
        console.log("Using Next.js built-in Terser optimization");
      }
    }
    return config;
  },
};

export default nextConfig;