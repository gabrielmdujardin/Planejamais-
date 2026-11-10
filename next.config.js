/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        hostname: "*",
      },
    ],
    unoptimized: true,
  },
  turbopack: {},
}

module.exports = nextConfig
