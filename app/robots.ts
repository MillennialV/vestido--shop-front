import { MetadataRoute } from 'next';
import { PUBLIC_URL } from '@/lib/seo';

export default function robots(): MetadataRoute.Robots {
    return {
        rules: [
            {
                userAgent: '*',
                allow: '/',
                disallow: ['/admin/', '/carrito/', '/api/', '/_next/'],
            },
            {
                userAgent: [
                    '*',
                    'Google-Extended',
                    'GPTBot',
                    'ChatGPT-User',
                    'ClaudeBot',
                    'Claude-Web',
                    'anthropic-ai',
                    'PerplexityBot',
                    'cohere-ai'
                ],
                allow: '/',
                disallow: ['/admin/', '/carrito/', '/api/', '/_next/'],
            }
        ],
        sitemap: `${PUBLIC_URL}/sitemap.xml`,
        host: PUBLIC_URL,
    };
}
