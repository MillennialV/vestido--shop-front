import HomeClient from "@/components/HomeClient";
import { Metadata } from "next";
import { PUBLIC_URL, SITE_CONFIG } from "@/lib/metadata-constants";

const INVENTARIO_BASE_API = process.env.NEXT_PUBLIC_API_INVENTARIO_BASE_URL || 'http://localhost:3001';
const BLOG_BASE_API = process.env.NEXT_PUBLIC_API_BLOG_BASE_URL || 'https://blog-millennial.iaimpacto.com';
const FAQS_BASE_API = process.env.NEXT_PUBLIC_API_PREGUNTAS_BASE_URL || 'http://localhost:3005';
const DEFAULT_OG_IMAGE = SITE_CONFIG.ogImage;

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
    let slug: string | null = null;
    if (slugArray && slugArray.length > 0) {
        slug = slugArray[0] === "producto" && slugArray.length > 1 ? slugArray[1] : slugArray[0];
    }



    if (!slug || slug === "producto" || slug === "envios" || slug === "nosotros") {
        const isEnvios = slug === "envios";
        const isNosotros = slug === "nosotros";

        const title = isEnvios 
            ? `Políticas de Envío | ${SITE_CONFIG.name}` 
            : isNosotros 
                ? `Sobre Nosotros | ${SITE_CONFIG.name}`
                : SITE_CONFIG.defaultTitle;

        const description = isEnvios
            ? "Conoce nuestras políticas de envío express a todo el Perú. Entrega segura en 24-48 horas."
            : isNosotros
                ? "Conoce más sobre Womanity Boutique y nuestra pasión por los vestidos de fiesta."
                : SITE_CONFIG.defaultDescription;

        const url = slug ? `${PUBLIC_URL}/${slug}` : PUBLIC_URL;

        return {
            title,
            description,
            alternates: {
                canonical: url,
            },
            openGraph: {
                url: url,
                type: "website",
                title,
                description,
                images: [{ url: DEFAULT_OG_IMAGE, width: 1200, height: 630 }],
            },
            twitter: {
                card: "summary_large_image",
                title,
                description,
                images: [DEFAULT_OG_IMAGE],
            },
            robots: "index, follow",
        };
    }

    // Buscar el producto para obtener su imagen real
    const product = await getProduct(slug);

    const productTitle = product?.title
        ? `${product.title} | ${SITE_CONFIG.brandName}`
        : `Vestido ${slug.replace(/-/g, ' ')} | ${SITE_CONFIG.name}`;

    const productDescription = product?.description
        || SITE_CONFIG.defaultDescription;

    // Prioridad: imagen_principal → primera imagen extra → imagen por defecto
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
            siteName: SITE_CONFIG.name,
            locale: SITE_CONFIG.locale,
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
    try {
        const res = await fetch(`${INVENTARIO_BASE_API}/api/producto/obtener-listado-productos?q=${slug}&limit=1`);
        if (res.ok) {
            const data = await res.json();
            const products = data?.data?.products || [];
            // Devuelve el primer producto si coincide el slug (en este endpoint q filtra texto amplio, nos aseguramos)
            return products.find((p: any) => p.slug === slug) || products[0] || null;
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
        "description": product.description || `Vestido elegante ${product.title} disponible en Womanity Boutique San Isidro.`,
        "brand": {
            "@type": "Brand",
            "name": product.brand || SITE_CONFIG.brandName
        },
        // Bug 4: agregar sku si existe
        ...(product.sku ? { "sku": product.sku } : {}),
        "offers": {
            "@type": "Offer",
            "url": `${PUBLIC_URL}/producto/${product.slug}`,
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
