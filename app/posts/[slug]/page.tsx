import PostDetailClient from "./PostDetailClient";
import { generateMetadata } from "./generateMetadata";

export { generateMetadata };

// Para Static Generation de slugs de posts
export async function generateStaticParams() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || ''}/api/posts?limit=100`);
  if (!res.ok) return [];
  const posts = await res.json();
  return posts.map((post: any) => ({ slug: post.slug })) || [];
}

export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <PostDetailClient slug={slug} />;
}
// ...existing code...
