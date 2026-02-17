import { MetadataRoute } from 'next';
import { PUBLIC_URL } from '@/lib/seo';

export default function robots(): MetadataRoute.Robots {
    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: ['/admin/', '/carrito/'],
        },
        sitemap: `${PUBLIC_URL}/sitemap.xml`,
    };
}
