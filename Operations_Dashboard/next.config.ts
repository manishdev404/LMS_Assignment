import type { NextConfig } from 'next';

const backendUrl = process.env.BACKEND_URL ?? 'http://localhost:4000';

const nextConfig: NextConfig = {
  /**
   * Same-origin API: the browser calls /api/* on this app and Next.js forwards it to the Express
   * backend. The backend's httpOnly session cookie is therefore first-party, and no CORS is needed.
   */
  async rewrites() {
    return [{ source: '/api/:path*', destination: `${backendUrl}/api/:path*` }];
  },
  turbopack: {
    rules: {
      '*.css': {
        loaders: ['@tailwindcss/turbopack'],
        as: '*.css',
      },
    },
  },
};

export default nextConfig;
