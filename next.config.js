const { withSentryConfig } = require('@sentry/nextjs');

/** @type {import('next').NextConfig} */
const nextConfig = {};

// Add bundle analyzer
const withBundleAnalyzer = 
  process.env.ANALYZE === 'true'
    ? require('@next/bundle-analyzer')({ enabled: true })
    : (config) => config;

// Apply optimizations for production build
const optimizedConfig = {
  ...nextConfig,
  
  // Enable image optimization with sharp
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 86400, // 1 day
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  
  // Optimize build output
  swcMinify: true,
  
  // Enable Strict Mode for better development experience
  reactStrictMode: true,
  
  // Compress assets
  compress: true,
  
  // Tree shake unused components
  experimental: {
    optimizeCss: true,
    optimizeServerReact: true,
  },
  
  // Transpile dependencies if needed
  transpilePackages: [],
  
  // Increase webpack performance budget
  webpack: (config, { dev, isServer }) => {
    if (!dev && !isServer) {
      // Add custom webpack optimizations for client production build
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          // Create bundle for tiptap
          tiptap: {
            test: /[\\/]node_modules[\\/](@tiptap)[\\/]/,
            name: 'tiptap',
            priority: 20,
          },
          // Create bundle for map related dependencies
          maps: {
            test: /[\\/]node_modules[\\/](leaflet|react-leaflet|geolib)[\\/]/,
            name: 'maps',
            priority: 20,
          },
          // Create bundle for UI components
          ui: {
            test: /[\\/]node_modules[\\/](@radix-ui)[\\/]/,
            name: 'ui-components',
            priority: 20,
          },
          // Default vendor bundle
          vendors: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            priority: 10,
          },
        },
      };
    }
    return config;
  },
};

// Apply bundle analyzer first, then Sentry
module.exports = withSentryConfig(
  withBundleAnalyzer(optimizedConfig)
); 