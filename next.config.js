/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 86400,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  reactStrictMode: true,
  compress: true,
  transpilePackages: [
    "@sentry/nextjs",
    "react-leaflet",
    "leaflet",
    "geolib",
    "tailwindcss-animate",
    "@tiptap/react"
  ],
  typescript: {
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    ignoreBuildErrors: true,
  },
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  // Environment variables
  env: {
    SKIP_DATABASE_CALLS: process.env.SKIP_DATABASE_CALLS === 'true' ? 'true' : 'false'
  }
}

module.exports = nextConfig; 