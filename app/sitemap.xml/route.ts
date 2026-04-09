import { NextResponse } from 'next/server';
import { PUBLIC_URL } from '@/lib/seo';
import { getDomain } from '@/lib/get-domain';
import { slugify } from '@/lib/slugify';

const INVENTARIO_BASE_API = process.env.NEXT_PUBLIC_API_INVENTARIO_BASE_URL || 'http://localhost:3001';
const BLOG_BASE_API = process.env.NEXT_PUBLIC_API_BLOG_BASE_URL || 'https://blog-millennial.iaimpacto.com';

async function getGarments(domain: string) {
    try {
        const res = await fetch(`${INVENTARIO_BASE_API}/api/producto/obtener-listado-productos?limit=2000&domain=${domain}`);
        if (res.ok) {
            const data = await res.json();
            return data?.data?.products || [];
        }
    } catch (error) {
        console.error("Error fetching garments for sitemap:", error);
    }
    return [];
}

async function getPosts(domain: string) {
    try {
        const res = await fetch(`${BLOG_BASE_API}/api/blog/posts?limit=500&domain=${domain}`);
        if (res.ok) {
            const data = await res.json();
            return data?.data?.posts || [];
        }
    } catch (error) {
        console.error("Error fetching posts for sitemap:", error);
    }
    return [];
}

function escapeXml(unsafe: string) {
    return unsafe.replace(/[<>&'"]/g, (c) => {
        switch (c) {
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '&': return '&amp;';
            case '\'': return '&apos;';
            case '"': return '&quot;';
            default: return c;
        }
    });
}

export async function GET() {
    const domain = await getDomain();
    const protocol = domain.includes('localhost') ? 'http' : 'https';
    const baseUrl = `${protocol}://${domain}`;

    const [garments, posts] = await Promise.all([
        getGarments(domain),
        getPosts(domain)
    ]);

    // Deduplicación usando un Set de URLs
    const usedUrls = new Set<string>();

    const xmlItems: string[] = [];

    // 1. Home
    xmlItems.push(`
  <url>
    <loc>${baseUrl}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>`);
    usedUrls.add(baseUrl);

    // 2. Productos
    garments.forEach((garment: any) => {
        const slug = garment.slug || slugify(garment.title);
        const url = `${baseUrl}/producto/${slug}`;
        
        if (usedUrls.has(url)) return;
        usedUrls.add(url);

        const lastMod = garment.updated_at || garment.created_at ? new Date(garment.updated_at || garment.created_at).toISOString() : new Date().toISOString();
        
        // Determinar imagen para el sitemap
        const imageUrl = garment.imagen_principal || 
                        (garment.imagenes && garment.imagenes.length > 0 ? garment.imagenes[0] : null) ||
                        (garment.videoUrl ? `${garment.videoUrl}${garment.videoUrl.includes('?') ? '&' : '#'}t=0.1` : null);

        xmlItems.push(`
  <url>
    <loc>${url}</loc>
    <lastmod>${lastMod}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>${imageUrl ? `
    <image:image>
      <image:loc>${escapeXml(imageUrl)}</image:loc>
      <image:title>${escapeXml(garment.title || 'Producto')}</image:title>
    </image:image>` : ''}
  </url>`);
    });

    // 3. Posts
    posts.forEach((post: any) => {
        const url = `${baseUrl}/posts/${post.slug}`;
        
        if (usedUrls.has(url)) return;
        usedUrls.add(url);

        const lastMod = post.updated_at || post.created_at ? new Date(post.updated_at || post.created_at).toISOString() : new Date().toISOString();
        
        xmlItems.push(`
  <url>
    <loc>${url}</loc>
    <lastmod>${lastMod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>${post.featured_image_url ? `
    <image:image>
      <image:loc>${escapeXml(post.featured_image_url)}</image:loc>
      <image:title>${escapeXml(post.title || 'Post')}</image:title>
    </image:image>` : ''}
  </url>`);
    });

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${xmlItems.join('')}
</urlset>`;

    return new NextResponse(sitemap, {
        headers: {
            'Content-Type': 'application/xml',
            'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=59',
        },
    });
}
