import type { Metadata } from "next";
import { postService } from "@/services/postService";

// Metadata dinámica para cada post (solo server)
export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
    const response = await postService.readPosts({ limit: 100 });
    const post = response.posts?.find((p) => p.slug === params.slug);
    if (!post) {
        return {
            title: "Post no encontrado | Vestidos de Fiesta",
            description: "No se encontró el post solicitado.",
            robots: "noindex, nofollow",
        };
    }
    return {
        title: post.title + " | Vestidos de Fiesta",
        description:
            post.seo_description ||
            post.content?.slice(0, 160) ||
            "Post de blog de vestidos de fiesta.",
        openGraph: {
            title: post.title,
            description: post.seo_description || post.content?.slice(0, 160),
            url: `https://www.vestido.shop/posts/${post.slug}`,
            type: "article",
            images: post.featured_image_url
                ? [{ url: post.featured_image_url, width: 1200, height: 630 }]
                : [
                    {
                        url: "https://storage.googleapis.com/aistudio-hosting/VENICE-og-image.jpg",
                        width: 1200,
                        height: 630,
                    },
                ],
            locale: "es_PE",
        },
        robots: "index, follow",
    };
}
