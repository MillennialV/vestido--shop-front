export const dynamicParams = true;

import PostDetailClient from "./PostDetailClient";
import { generateMetadata } from "./generateMetadata";

export { generateMetadata };

// Para Static Generation de slugs de posts
export async function generateStaticParams() {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL
    || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

  // if (!baseUrl) { return []; } // Ya no es necesario


  try {
    const res = await fetch(`${baseUrl}/api/posts?limit=100`, {
      next: { revalidate: 3600 }
    });

    if (!res.ok) throw new Error("Respuesta de API no exitosa");

    const data = await res.json();
    const postsArray = data.posts || [];

    return postsArray.map((post: any) => ({
      slug: post.slug
    }));
  } catch (error) {
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
