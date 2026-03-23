import { MetadataRoute } from 'next';
import { PUBLIC_URL } from '@/lib/seo';
import { getDomain } from '@/lib/get-domain';
import { slugify } from '@/lib/slugify';

const INVENTARIO_BASE_API = process.env.NEXT_PUBLIC_API_INVENTARIO_BASE_URL || 'http://localhost:3001';

const BLOG_BASE_API = process.env.NEXT_PUBLIC_API_BLOG_BASE_URL || 'https://blog-millennial.iaimpacto.com';

async function getGarments() {
    const domain = await getDomain();
    try {
        const res = await fetch(`${INVENTARIO_BASE_API}/api/producto/obtener-listado-productos?limit=1000&domain=${domain}`);
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
    const domain = await getDomain();
    try {
        const res = await fetch(`${BLOG_BASE_API}/api/blog/posts?limit=100&domain=${domain}`);
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

    console.log(`[Sitemap] Summary: Found ${garments?.length || 0} products and ${posts?.length || 0} posts.`);

    const productEntries = garments.map((garment: any) => {
        const slug = slugify(garment.title);
        const url = `${PUBLIC_URL}/producto/${slug}`;
        
        return {
            url,
            lastModified: garment.updated_at || garment.created_at ? new Date(garment.updated_at || garment.created_at) : new Date(),
            changeFrequency: 'weekly' as const,
            priority: 0.7,
        };
    });

    const blogEntries = posts.map((post: any) => {
        const url = `${PUBLIC_URL}/posts/${post.slug}`;
        
        return {
            url,
            lastModified: post.updated_at || post.created_at ? new Date(post.updated_at || post.created_at) : new Date(),
            changeFrequency: 'monthly' as const,
            priority: 0.8,
        };
    });

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
