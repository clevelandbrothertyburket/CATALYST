/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'www.clevelandbrothers.com' },
      { protocol: 'https', hostname: 'rent.cat.com' },
    ],
  },
};
export default nextConfig;
