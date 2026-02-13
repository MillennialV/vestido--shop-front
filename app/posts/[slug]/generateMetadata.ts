import type { Metadata } from "next";
import { PUBLIC_URL } from "@/lib/seo";

const DEFAULT_IMAGE_URL = "https://storage.googleapis.com/aistudio-hosting/VENICE-og-image.jpg";
// Usamos la URL directa del servicio de blog para evitar llamadas a la propia API (que fallan en Vercel durante el render)
const BLOG_API_URL = process.env.NEXT_PUBLIC_API_BLOG_BASE_URL || 'https://blog-millennial.iaimpacto.com';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    try {
        // Await params to comply with Next.js 15+ async routing
        const { slug } = await params;

        // Fetch directo al backend externo
        const res = await fetch(`${BLOG_API_URL}/api/blog/posts?limit=100`, {
            next: { revalidate: 3600 } // Cache por 1 hora
        });

        if (!res.ok) {
            console.warn(`Error fetching metadata posts: ${res.status}`);
            return {
                title: "Post no encontrado | Vestidos de Fiesta",
                description: "No se encontró el post solicitado.",
                robots: "noindex, nofollow",
            };
        }

        const result = await res.json();
        // La estructura directa del backend es { data: { posts: [...] } }
        // (Basado en como lo maneja route.ts)
        const postsArray = result.data?.posts || [];

        // Ahora sí podemos usar .find() sobre el array
        const post = postsArray.find((p: any) => p.slug === slug);

        if (!post) {
            return {
                title: "Post no encontrado | Vestidos de Fiesta",
                description: "No se encontró el post solicitado.",
                robots: "noindex, nofollow",
            };
        }

        const description = post.seo_description || post.content?.replace(/<[^>]*>?/gm, '').slice(0, 160) || "Post de blog de vestidos de fiesta.";
        const image = post.featured_image_url || DEFAULT_IMAGE_URL;
        const url = `${PUBLIC_URL}/posts/${post.slug}`;

        return {
            title: `${post.title} | Vestidos de Fiesta`,
            description,
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
                locale: "es_PE",
            },
            robots: "index, follow",
        };
    } catch (error) {
        console.error("Error in generateMetadata:", error);
        return {
            title: "Vestidos de Fiesta | Womanity Boutique",
            description: "Vestidos de fiesta exclusivos en Lima.",
            robots: "index, follow", // Permitir indexado genérico en caso de error temporal
        };
    }
}