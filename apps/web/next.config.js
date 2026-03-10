/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    transpilePackages: ['@saifcontrol/shared'],
    async rewrites() {
        return [
            {
                source: '/api/:path*',
                destination: 'http://localhost:4800/api/:path*',
            },
        ];
    },
};

module.exports = nextConfig;
