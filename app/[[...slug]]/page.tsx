import HomeClient from "@/components/pages/HomeClient";
import { Metadata } from "next";
import { PUBLIC_URL } from "@/lib/seo";
import { getDomain } from "@/lib/get-domain";
import { slugify } from "@/lib/slugify";

const INVENTARIO_BASE_API = process.env.NEXT_PUBLIC_API_INVENTARIO_BASE_URL || 'http://localhost:3001';
const BLOG_BASE_API = process.env.NEXT_PUBLIC_API_BLOG_BASE_URL || 'https://blog-millennial.iaimpacto.com';
const FAQS_BASE_API = process.env.NEXT_PUBLIC_API_PREGUNTAS_BASE_URL || 'http://localhost:3005';
const DEFAULT_OG_IMAGE = "https://storage.googleapis.com/aistudio-hosting/VENICE-og-image.jpg";

async function fetchInitialData() {
    const revalidate = 60;
    const domain = await getDomain();
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

export async function generateMetadata({ params }: { params: Promise<{ slug?: string[] }> }): Promise<Metadata> {
    const resolvedParams = await params;
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
                canonical: PUBLIC_URL,
            },
            openGraph: {
                url: PUBLIC_URL,
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
        const pageUrl = `${PUBLIC_URL}/${slug}`;
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
    // Solo buscamos producto si el slug no es una página estática
    const product = await getProduct(slug);

    const productTitle = product?.title
        ? `${product.title} | Mi tienda`
        : `${slug.replace(/-/g, ' ')} | Tienda online`;

    const productDescription = product?.description
        || "Encuentra productos elegantes e importados en nuestra tienda online.";

    const productImage: string =
        product?.imagen_principal ||
        (product?.imagenes && product.imagenes.length > 0 ? product.imagenes[0] : null) ||
        DEFAULT_OG_IMAGE;

    const productUrl = `${PUBLIC_URL}/producto/${slug}`;

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

async function getProduct(slug: string) {
    const domain = await getDomain();
    try {
        const res = await fetch(`${INVENTARIO_BASE_API}/api/producto/obtener-listado-productos?q=${slug}&limit=1&domain=${domain}`);
        if (res.ok) {
            const data = await res.json();
            const products = data?.data?.products || [];
            // Devuelve el primer producto si coincide el slug calculado del título
            return products.find((p: any) => slugify(p.title) === slug) || products[0] || null;
        }
    } catch (error) {
        console.error("Error fetching product for schema:", error);
    }
    return null;
}

export default async function CatchAllPage({ params }: { params: Promise<{ slug?: string[] }> }) {
    const resolvedParams = await params;
    const slugArray = resolvedParams.slug;
    let slug: string | null = null;
    if (slugArray && slugArray.length > 0) {
        slug = slugArray[0] === "producto" && slugArray.length > 1 ? slugArray[1] : slugArray[0];
    }

    const [initialData, product] = await Promise.all([
        fetchInitialData(),
        (slug && slug !== "producto") ? getProduct(slug) : Promise.resolve(null)
    ]);

    // Bug 1: solo generar schema si el producto tiene slug válido
    const productJsonLd = (product && product.slug) ? {
        "@context": "https://schema.org",
        "@type": "Product",
        "name": product.title,
        // Bug 2: usar imagen real del producto, no la URL del video
        "image": product.imagen_principal || product.imagenes?.[0] || DEFAULT_OG_IMAGE,
        "description": product.description || `${product.title} disponible en nuestra tienda online.`,
        "brand": {
            "@type": "Brand",
            "name": product.brand || "Mi tienda"
        },
        // Bug 4: agregar sku si existe
        ...(product.sku ? { "sku": product.sku } : {}),
        "offers": {
            "@type": "Offer",
            "url": `${PUBLIC_URL}/producto/${slugify(product.title)}`,
            "priceCurrency": "PEN",
            // Bug 3: solo incluir price si tiene valor real
            ...(product.price ? { "price": String(product.price) } : {}),
            "availability": "https://schema.org/InStock",
            // Bug 5: agregar itemCondition requerido por Google Shopping
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
