import HomeClient from "@/components/HomeClient";
import { Metadata } from "next";
import { PUBLIC_URL } from "@/lib/seo";

const INVENTARIO_BASE_API = process.env.NEXT_PUBLIC_API_INVENTARIO_BASE_URL || 'http://localhost:3001';
const BLOG_BASE_API = process.env.NEXT_PUBLIC_API_BLOG_BASE_URL || 'https://blog-millennial.iaimpacto.com';
const FAQS_BASE_API = process.env.NEXT_PUBLIC_API_PREGUNTAS_BASE_URL || 'http://localhost:3005';

async function fetchInitialData() {
    const revalidate = 60;
    try {
        const [garmentsRes, postsRes, faqsRes] = await Promise.all([
            fetch(`${INVENTARIO_BASE_API}/api/producto/obtener-listado-productos?page=1&limit=15&sort=created_at&order=desc`, {
                next: { revalidate }
            }),
            fetch(`${BLOG_BASE_API}/api/blog/posts?page=1&limit=6&sort=created_at&order=desc`, {
                next: { revalidate }
            }),
            fetch(`${FAQS_BASE_API}/api/preguntas?limit=${process.env.NEXT_PUBLIC_FAQ_LIMIT || 5}&estado=activa&order=asc`, {
                next: { revalidate }
            })
        ]);

        const [garmentsData, postsData, faqsData] = await Promise.all([
            garmentsRes.ok ? garmentsRes.json() : { data: { products: [] } },
            postsRes.ok ? postsRes.json() : { data: { posts: [] } },
            faqsRes.ok ? faqsRes.json() : { data: { preguntas: [] } },
        ]);

        return {
            garments: garmentsData?.data?.products || [],
            pagination: garmentsData?.data || null,
            posts: postsData?.data?.posts || [],
            faqs: faqsData?.data?.preguntas || []
        };
    } catch (error) {
        console.error("Error fetching initial data:", error);
        return { garments: [], pagination: null, posts: [], faqs: [] };
    }
}

export async function generateMetadata({ params }: { params: Promise<{ slug?: string[] }> }): Promise<Metadata> {
    const resolvedParams = await params;
    const slugArray = resolvedParams.slug;
    const slug = slugArray && slugArray.length > 0 ? slugArray[0] : null;

    if (!slug) {
        return {
            title: "Vestidos de Fiesta en Lima | Showroom en San Isidro",
            description: "Encuentra vestidos elegantes e importados en nuestro showroom de San Isidro.",
            openGraph: {
                url: PUBLIC_URL,
                type: "website",
            },
            robots: "index, follow",
        };
    }

    return {
        title: `Vestido ${slug.replace(/-/g, ' ')} | Vestido.shop`,
        description: "Encuentra vestidos elegantes e importados en nuestro showroom de San Isidro.",
        openGraph: {
            url: `${PUBLIC_URL}/${slug}`,
            type: "website",
        }
    };
}

async function getProduct(slug: string) {
    try {
        const res = await fetch(`${INVENTARIO_BASE_API}/api/producto/obtener-listado-productos?limit=1000`);
        if (res.ok) {
            const data = await res.json();
            const products = data?.data?.products || [];
            return products.find((p: any) => p.slug === slug);
        }
    } catch (error) {
        console.error("Error fetching product for schema:", error);
    }
    return null;
}

export default async function CatchAllPage({ params }: { params: Promise<{ slug?: string[] }> }) {
    const resolvedParams = await params;
    const slugArray = resolvedParams.slug;
    const slug = slugArray && slugArray.length > 0 ? slugArray[0] : null;

    const [initialData, product] = await Promise.all([
        fetchInitialData(),
        slug ? getProduct(slug) : Promise.resolve(null)
    ]);

    const productJsonLd = product ? {
        "@context": "https://schema.org",
        "@type": "Product",
        "name": product.title,
        "image": product.video_url?.replace(".mp4", ".webp") || product.poster_url, // Usar poster si existe
        "description": product.description || `Vestido elegante ${product.title} disponible en Womanity Boutique San Isidro.`,
        "brand": {
            "@type": "Brand",
            "name": product.brand || "Womanity Boutique"
        },
        "offers": {
            "@type": "Offer",
            "url": `${PUBLIC_URL}/${product.slug}`,
            "priceCurrency": "PEN",
            "price": product.price || 0,
            "availability": "https://schema.org/InStock"
        }
    } : null;

    return (
        <>
            {productJsonLd && (
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
                />
            )}
            <HomeClient
                initialGarments={initialData.garments}
                initialPagination={initialData.pagination}
                initialPosts={initialData.posts}
                initialFaqs={initialData.faqs}
            />
        </>
    );
}
