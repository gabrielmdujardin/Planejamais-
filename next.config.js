const nextConfig = {
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        hostname: '*',
      },
    ],
    unoptimized: true,
  },
  turbopack: {},

};

module.exports = nextConfig;
