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

export default async function CatchAllPage({ params }: { params: Promise<{ slug?: string[] }> }) {
    const resolvedParams = await params;
    const { garments, pagination, posts, faqs } = await fetchInitialData();
    return (
        <HomeClient
            initialGarments={garments}
            initialPagination={pagination}
            initialPosts={posts}
            initialFaqs={faqs}
        />
    );
}
