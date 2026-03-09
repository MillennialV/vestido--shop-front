import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: '**',
            },
        ],
    },
    compiler: {
        // Remove console logs in production
        removeConsole: process.env.NODE_ENV === 'production',
    },
    compress: true,
    experimental: {
        // Optimize package imports to reduce bundle size
        optimizePackageImports: ['react-quill-new', '@hello-pangea/dnd', 'lucide-react'],
        // Enable CSS optimization
        optimizeCss: true,
    },
    async headers() {
        return [
            {
                // Enable bfcache for all pages
                source: '/:path*',
                headers: [
                    {
                        key: 'Cache-Control',
                        value: 'public, max-age=0, must-revalidate',
                    },
                ],
            },
        ];
    },
}

export default nextConfig