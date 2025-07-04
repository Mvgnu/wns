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
    domains: [
      'images.unsplash.com',
      'lh3.googleusercontent.com',
      'avatars.githubusercontent.com',
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
  },
  // Enable Next.js to properly handle API routes
  experimental: {
    appDir: true,
  },
  // Handle redirects (optional)
  async redirects() {
    return [
      {
        source: '/login',
        destination: '/auth/signin',
        permanent: true,
      },
      {
        source: '/register',
        destination: '/auth/signup',
        permanent: true,
      },
    ];
  }
}

module.exports = nextConfig; 