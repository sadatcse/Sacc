import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  compress: true,
  poweredByHeader: false, // don't advertise the framework (X-Powered-By: Next.js)
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
    // `npm run build:cpanel` sets NEXT_IMAGE_UNOPTIMIZED=1 and puts the marker in its package
    unoptimized: process.env.NEXT_IMAGE_UNOPTIMIZED === '1' || fs.existsSync(path.join(projectRoot, '.image-unoptimized')),
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
          // No framing by other sites, no <base> / plugin injection, forms only post back here. (Scripts aren't
          // restricted: Next.js, the theme script and JSON-LD are inline.)
          { key: 'Content-Security-Policy', value: "frame-ancestors 'self'; base-uri 'self'; form-action 'self'; object-src 'none'" },
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
        ],
      },
      {
        // Photos and icons in public/: browsers keep them a day and reuse them for a week while checking for a
        // newer copy — repeat visits on slow connections don't download them again
        source: '/:all*(svg|jpg|jpeg|png|webp|gif|ico)',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=604800' }],
      },
    ];
  },
};

export default nextConfig;
