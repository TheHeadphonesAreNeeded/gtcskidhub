/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Lint is run separately via `npm run lint`; don't fail production
  // builds on lint findings.
  eslint: { ignoreDuringBuilds: true },
  images: {
    // Thumbnails and Discord avatars are remote images.
    remotePatterns: [
      { protocol: "https", hostname: "cdn.discordapp.com" },
      { protocol: "https", hostname: "**" },
    ],
  },
};

module.exports = nextConfig;
