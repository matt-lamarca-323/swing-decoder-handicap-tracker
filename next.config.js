/** @type {import('next').NextConfig} */
const path = require('path')

const nextConfig = {
  images: {
    domains: ['lh3.googleusercontent.com'], // Google OAuth profile images
  },
  // Note: Server-side env vars (DATABASE_URL, AUTH_*, etc.) are automatically
  // available via process.env at runtime. Don't add them here or they get
  // baked in at build time.
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname),
    }
    return config
  },
}

module.exports = nextConfig
