import HomeClient from "@/components/pages/HomeClient";
import { Metadata } from "next";
import { PUBLIC_URL } from "@/lib/seo";
import { slugify } from "@/lib/slugify";

const INVENTARIO_BASE_API = process.env.NEXT_PUBLIC_API_INVENTARIO_BASE_URL || 'http://localhost:3001';
const BLOG_BASE_API = process.env.NEXT_PUBLIC_API_BLOG_BASE_URL || 'https://blog-millennial.iaimpacto.com';
const FAQS_BASE_API = process.env.NEXT_PUBLIC_API_PREGUNTAS_BASE_URL || 'http://localhost:3005';
const DEFAULT_OG_IMAGE = "https://storage.googleapis.com/aistudio-hosting/VENICE-og-image.jpg";

async function fetchInitialData(domain: string) {
    const revalidate = 60;
    try {
        const [garmentsRes, postsRes, faqsRes] = await Promise.all([
            fetch(`${INVENTARIO_BASE_API}/api/producto/obtener-listado-productos?page=1&limit=15&sort=created_at&order=desc&domain=${domain}`, {
                next: { revalidate }
            }),
            fetch(`${BLOG_BASE_API}/api/blog/posts?page=1&limit=6&sort=created_at&order=desc&domain=${domain}`, {
                next: { revalidate }
            }),
            fetch(`${FAQS_BASE_API}/api/preguntas?limit=${process.env.NEXT_PUBLIC_FAQ_LIMIT || 5}&estado=activa&order=asc&domain=${domain}`, {
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

const STATIC_PAGES: Record<string, { title: string, description: string }> = {
    'envios': {
        title: 'Envíos y Devoluciones | Mi tienda',
        description: 'Información sobre plazos de entrega, costos de envío y nuestra política de cambios y devoluciones.'
    },
    'privacidad': {
        title: 'Política de Privacidad | Mi tienda',
        description: 'Conoce cómo protegemos tus datos personales y tu privacidad.'
    },
    'terminos': {
        title: 'Términos y Condiciones | Mi tienda',
        description: 'Términos Legales y condiciones de uso de nuestro sitio web y servicios.'
    }
};

export async function generateMetadata({ params }: { params: Promise<{ site: string, slug?: string[] }> }): Promise<Metadata> {
    const resolvedParams = await params;
    const domain = resolvedParams.site;
    const slugArray = resolvedParams.slug;
    let slug: string | null = null;
    let isProductPath = false;

    if (slugArray && slugArray.length > 0) {
        if (slugArray[0] === "producto" && slugArray.length > 1) {
            slug = slugArray[1];
            isProductPath = true;
        } else {
            slug = slugArray[0];
        }
    }

    // 1. Home Page o fallback
    if (!slug || slug === "producto") {
        return {
            title: "Mi tienda | Tienda online",
            description: "Encuentra productos exclusivos en nuestra tienda online.",
            alternates: {
                canonical: `https://${domain}`,
            },
            openGraph: {
                url: `https://${domain}`,
                type: "website",
                images: [{ url: DEFAULT_OG_IMAGE, width: 1200, height: 630 }],
            },
            twitter: {
                card: "summary_large_image",
                images: [DEFAULT_OG_IMAGE],
            },
            robots: "index, follow",
        };
    }

    // 2. Páginas Estáticas
    if (STATIC_PAGES[slug]) {
        const page = STATIC_PAGES[slug];
        const pageUrl = `https://${domain}/${slug}`;
        return {
            title: page.title,
            description: page.description,
            alternates: {
                canonical: pageUrl,
            },
            openGraph: {
                url: pageUrl,
                type: "website",
                title: page.title,
                description: page.description,
                images: [{ url: DEFAULT_OG_IMAGE, width: 1200, height: 630 }],
            },
            robots: "index, follow",
        };
    }

    // 3. Productos
    const product = await getProduct(slug, domain);

    const productTitle = product?.title
        ? `${product.title} | Mi tienda`
        : `${slug.replace(/-/g, ' ')} | Tienda online`;

    const productDescription = product?.description
        || "Encuentra productos elegantes e importados en nuestra tienda online.";

    const productImage: string =
        product?.imagen_principal ||
        (product?.imagenes && product.imagenes.length > 0 ? product.imagenes[0] : null) ||
        DEFAULT_OG_IMAGE;

    const productUrl = `https://${domain}/producto/${slug}`;

    return {
        title: productTitle,
        description: productDescription,
        alternates: {
            canonical: productUrl,
        },
        openGraph: {
            url: productUrl,
            type: "website",
            title: productTitle,
            description: productDescription,
            images: [
                {
                    url: productImage,
                    width: 800,
                    height: 1000,
                    alt: product?.title || slug,
                },
            ],
            siteName: "Mi tienda",
            locale: "es_PE",
        },
        twitter: {
            card: "summary_large_image",
            title: productTitle,
            description: productDescription,
            images: [productImage],
        },
    };
}

async function getProduct(slug: string, domain: string) {
    try {
        const res = await fetch(`${INVENTARIO_BASE_API}/api/producto/obtener-listado-productos?q=${slug}&limit=1&domain=${domain}`);
        if (res.ok) {
            const data = await res.json();
            const products = data?.data?.products || [];
            return products.find((p: any) => slugify(p.title) === slug) || products[0] || null;
        }
    } catch (error) {
        console.error("Error fetching product for schema:", error);
    }
    return null;
}

export default async function CatchAllPage({ params }: { params: Promise<{ site: string, slug?: string[] }> }) {
    const resolvedParams = await params;
    const domain = resolvedParams.site;
    const slugArray = resolvedParams.slug;
    let slug: string | null = null;
    if (slugArray && slugArray.length > 0) {
        slug = slugArray[0] === "producto" && slugArray.length > 1 ? slugArray[1] : slugArray[0];
    }

    const [initialData, product] = await Promise.all([
        fetchInitialData(domain),
        (slug && slug !== "producto") ? getProduct(slug, domain) : Promise.resolve(null)
    ]);

    const productJsonLd = (product && product.slug) ? {
        "@context": "https://schema.org",
        "@type": "Product",
        "name": product.title,
        "image": product.imagen_principal || product.imagenes?.[0] || DEFAULT_OG_IMAGE,
        "description": product.description || `${product.title} disponible en nuestra tienda online.`,
        "brand": {
            "@type": "Brand",
            "name": product.brand || "Mi tienda"
        },
        ...(product.sku ? { "sku": product.sku } : {}),
        "offers": {
            "@type": "Offer",
            "url": `https://${domain}/producto/${slugify(product.title)}`,
            "priceCurrency": "PEN",
            ...(product.price ? { "price": String(product.price) } : {}),
            "availability": "https://schema.org/InStock",
            "itemCondition": "https://schema.org/NewCondition"
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
