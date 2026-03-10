import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
    transpilePackages: ['@saifcontrol/shared'],
    output: 'standalone',
    poweredByHeader: false,
    reactStrictMode: true,
    async rewrites() {
        return [
            {
                source: '/api/:path*',
                destination: 'http://localhost:4800/api/:path*',
            },
            {
                source: '/ws',
                destination: 'http://localhost:4800/ws',
            },
        ];
    },
};

export default nextConfig;
