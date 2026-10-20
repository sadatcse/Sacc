import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  compress: true,
  // This project is nested inside another Next app's folder; pin the root so
  // Next doesn't pick up the parent's lockfile and instrumentation.js.
  turbopack: { root: projectRoot },
  outputFileTracingRoot: projectRoot,
  images: {
    // Photo fields accept a pasted link from any site (Facebook, Google Drive, university site…) as well as uploads
    // (/uploads/… on this server), so https images from any host can be shown and resized.
    remotePatterns: [{ protocol: 'https', hostname: '**' }],
    formats: ['image/avif', 'image/webp'],
    // Servers where the image library (sharp) can't run: `npm run build` leaves this marker → photos served as uploaded
    unoptimized: fs.existsSync(path.join(projectRoot, '.image-unoptimized')),
  },
  // Low-memory builds (old cPanel servers, `npm run build:low-memory`): scripts/build.js sets NEXT_LOW_RESOURCES=1
  ...(process.env.NEXT_LOW_RESOURCES === '1' && {
    experimental: {
      cpus: 1,
      workerThreads: false,
      webpackMemoryOptimizations: true,
      webpackBuildWorker: false, // compile in the main process — one Node process at a time counts against the account limit
      parallelServerCompiles: false,
      parallelServerBuildTraces: false,
      staticGenerationMaxConcurrency: 2,
    },
  }),
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },
};

export default nextConfig;
