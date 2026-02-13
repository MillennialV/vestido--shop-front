export const dynamicParams = true;

import PostDetailClient from "./PostDetailClient";
import { generateMetadata } from "./generateMetadata";

export { generateMetadata };

// Para Static Generation de slugs de posts
export async function generateStaticParams() {
  const BLOG_API_URL = process.env.NEXT_PUBLIC_API_BLOG_BASE_URL || 'https://blog-millennial.iaimpacto.com';

  try {
    const res = await fetch(`${BLOG_API_URL}/api/blog/posts?limit=100`, {
      next: { revalidate: 3600 }
    });

    if (!res.ok) throw new Error("Respuesta de API no exitosa");

    const result = await res.json();
    // Ajustar estructura de respuesta directa del backend: { data: { posts: [...] } }
    const postsArray = result.data?.posts || [];

    return postsArray.map((post: any) => ({
      slug: post.slug
    }));
  } catch (error) {
    console.error("Error generating static params:", error);
    return [];
  }
}

export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <PostDetailClient slug={slug} />;
}
