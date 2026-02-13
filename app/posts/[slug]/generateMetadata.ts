import type { Metadata } from "next";
import { PUBLIC_URL } from "@/lib/seo";

const DEFAULT_IMAGE_URL = "https://storage.googleapis.com/aistudio-hosting/VENICE-og-image.jpg";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    // Await params to comply with Next.js 15+ async routing
    const { slug } = await params;

    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL
        ? process.env.NEXT_PUBLIC_API_BASE_URL
        : (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

    const res = await fetch(`${baseUrl}/api/posts?limit=100`);

    if (!res.ok) {
        return {
            title: "Post no encontrado | Vestidos de Fiesta",
            description: "No se encontró el post solicitado.",
            robots: "noindex, nofollow",
        };
    }

    const data = await res.json();

    // IMPORTANTE: Accedemos al array dentro de la propiedad 'posts'
    const postsArray = data.posts || [];

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
}