import type { Metadata } from "next";
import { getDomain } from "@/lib/get-domain";
import { 
    BLOG_CONSTANTS, 
    DEFAULT_OG_IMAGE, 
    PUBLIC_URL,
    DEFAULT_SEO
} from "@/lib/constants";

// Usamos la URL directa del servicio de blog para evitar llamadas a la propia API (que fallan en Vercel durante el render)
const BLOG_API_URL = process.env.NEXT_PUBLIC_API_BLOG_BASE_URL || 'https://blog-millennial.iaimpacto.com';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    try {
        // Await params to comply with Next.js 15+ async routing
        const { slug } = await params;

        const domain = await getDomain();
        // Fetch directo al backend externo
        const res = await fetch(`${BLOG_API_URL}/api/blog/posts?limit=100&domain=${domain}`, {
            next: { revalidate: 3600 } // Cache por 1 hora
        });

        if (!res.ok) {
            console.warn(`Error fetching metadata posts: ${res.status}`);
            return {
                title: BLOG_CONSTANTS.postNotFoundTitle,
                description: BLOG_CONSTANTS.postNotFoundDescription,
                robots: "noindex, nofollow",
            };
        }

        const result = await res.json();
        const postsArray = result.data?.posts || [];

        const post = postsArray.find((p: any) => p.slug === slug);

        if (!post) {
            return {
                title: BLOG_CONSTANTS.postNotFoundTitle,
                description: BLOG_CONSTANTS.postNotFoundDescription,
                robots: "noindex, nofollow",
            };
        }

        const description = post.seo_description || post.content?.replace(/<[^>]*>?/gm, '').slice(0, 160) || BLOG_CONSTANTS.indexDescription;
        const image = post.featured_image_url || DEFAULT_OG_IMAGE;
        const url = `${PUBLIC_URL}/posts/${post.slug}`;

        return {
            title: `${post.title} | ${DEFAULT_SEO.siteName}`,
            description,
            alternates: {
                canonical: url,
            },
            openGraph: {
                title: post.title,
                description,
                url,
                type: "article",
                images: [
                    {
                        url: image,
                        width: 1200,
                        height: 630,
                    },
                ],
                locale: DEFAULT_SEO.locale,
            },
            robots: DEFAULT_SEO.robots,
        };
    } catch (error) {
        console.error("Error in generateMetadata:", error);
        return {
            title: DEFAULT_SEO.title,
            description: DEFAULT_SEO.description,
            robots: DEFAULT_SEO.robots,
        };
    }
}