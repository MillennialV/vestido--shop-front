import { MetadataRoute } from 'next';
import { PUBLIC_URL } from '@/lib/seo';

const INVENTARIO_BASE_API = process.env.NEXT_PUBLIC_API_INVENTARIO_BASE_URL || 'http://localhost:3001';

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

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const garments = await getGarments();

    const productEntries = garments.map((garment: any) => ({
        url: `${PUBLIC_URL}/${garment.slug}`,
        lastModified: garment.created_at ? new Date(garment.created_at) : new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
    }));

    return [
        {
            url: PUBLIC_URL,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 1.0,
        },
        ...productEntries,
    ];
}
