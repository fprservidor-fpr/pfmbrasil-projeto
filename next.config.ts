import type { NextConfig } from "next";
import path from "node:path";
const loaderPath = require.resolve('orchids-visual-edits/loader.js');

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
  },
    experimental: {
      serverActions: {
        allowedOrigins: [
          '3000-1d9ba5c4-3aff-425f-b323-d694ea012de6.orchids.cloud',
          '3000-1d9ba5c4-3aff-425f-b323-d694ea012de6.proxy.daytona.works'
        ]
      }
    },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  turbopack: {
    rules: {
      "*.{jsx,tsx}": {
        loaders: [loaderPath]
      }
    }
  }
};

export default nextConfig;
// Orchids restart: 1770923351641
