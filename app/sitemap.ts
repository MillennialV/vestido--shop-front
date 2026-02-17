import { MetadataRoute } from 'next';
import { PUBLIC_URL } from '@/lib/seo';

const INVENTARIO_BASE_API = process.env.NEXT_PUBLIC_API_INVENTARIO_BASE_URL || 'http://localhost:3001';

const BLOG_BASE_API = process.env.NEXT_PUBLIC_API_BLOG_BASE_URL || 'https://blog-millennial.iaimpacto.com';

async function getGarments() {
    try {
        const res = await fetch(`${INVENTARIO_BASE_API}/api/producto/obtener-listado-productos?limit=1000`);
        if (res.ok) {
            const data = await res.json();
            return data?.data?.products || [];
        }
    } catch (error) {
        console.error("Error fetching garments for sitemap:", error);
    }
    return [];
}

async function getPosts() {
    try {
        const res = await fetch(`${BLOG_BASE_API}/api/blog/posts?limit=100`);
        if (res.ok) {
            const data = await res.json();
            return data?.data?.posts || [];
        }
    } catch (error) {
        console.error("Error fetching posts for sitemap:", error);
    }
    return [];
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const [garments, posts] = await Promise.all([getGarments(), getPosts()]);

    const productEntries = garments.map((garment: any) => ({
        url: `${PUBLIC_URL}/${garment.slug}`,
        lastModified: garment.created_at ? new Date(garment.created_at) : new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
    }));

    const blogEntries = posts.map((post: any) => ({
        url: `${PUBLIC_URL}/posts/${post.slug}`,
        lastModified: post.updated_at ? new Date(post.updated_at) : new Date(),
        changeFrequency: 'monthly' as const,
        priority: 0.8,
    }));

    return [
        {
            url: PUBLIC_URL,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 1.0,
        },
        ...productEntries,
        ...blogEntries,
    ];
}
