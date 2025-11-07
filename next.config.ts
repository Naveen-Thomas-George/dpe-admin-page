/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true, // ✅ skips ESLint errors in builds
  },
};

export default nextConfig;
