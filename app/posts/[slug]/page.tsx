import PostDetailClient from "./PostDetailClient";
import { generateMetadata } from "./generateMetadata";
import { postService } from "@/services/postService";

export { generateMetadata };

// Para Static Generation de slugs de posts
export async function generateStaticParams() {
  const response = await postService.readPosts({ limit: 100 });
  return response.posts?.map((post) => ({ slug: post.slug })) || [];
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
