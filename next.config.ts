import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'images.unsplash.com',
            },
            {
                protocol: 'https',
                hostname: 'storage.googleapis.com',
            },
            {
                protocol: 'https',
                hostname: '**.iaimpacto.com',
            },
            {
                protocol: 'https',
                hostname: 'vestidosmillev.blob.core.windows.net',
                port: '',
                pathname: '/**', 
            },
        ],
    },
    compiler: {
        // Remove console logs in production
        removeConsole: process.env.NODE_ENV === 'production',
    },
    experimental: {
        // Optimize package imports to reduce bundle size
        optimizePackageImports: ['react-quill-new', '@hello-pangea/dnd'],
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