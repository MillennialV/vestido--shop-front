export const dynamic = 'force-dynamic';
export const revalidate = 3600; // Revalidar cada hora

import PostDetailClient from "@/app/posts/[slug]/PostDetailClient";
import { generateMetadata } from "@/app/posts/[slug]/generateMetadata";

export { generateMetadata };

const BLOG_BASE_API = process.env.NEXT_PUBLIC_API_BLOG_BASE_URL || 'https://blog-millennial.iaimpacto.com';

async function getPost(slug: string) {
  try {
    const res = await fetch(`${BLOG_BASE_API}/api/blog/posts?limit=100`);
    if (res.ok) {
      const data = await res.json();
      const postsArray = data.posts || [];
      return postsArray.find((p: any) => p.slug === slug);
    }
  } catch (error) {
    console.error("Error fetching post for schema:", error);
  }
  return null;
}

export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPost(slug);

  const jsonLd = post ? {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": post.title,
    "image": post.featured_image_url,
    "datePublished": post.created_at,
    "dateModified": post.updated_at,
    "author": {
      "@type": "Organization",
      "name": "Womanity Boutique",
      "url": "https://vestido.shop"
    },
    "publisher": {
      "@type": "Organization",
      "name": "Womanity Boutique"
    },
    "description": post.excerpt || post.title
  } : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <PostDetailClient slug={slug} />
    </>
  );
}
