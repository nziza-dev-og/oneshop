import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    // Keep existing remote patterns
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
  // Add experimental flag if needed for `fill` prop, though it should be stable now.
  // experimental: {
  //   images: {
  //     allowFutureImage: true,
  //   },
  // },
};

export default nextConfig;

      