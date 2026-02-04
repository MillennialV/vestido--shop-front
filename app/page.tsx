

import HomeClient from "@/components/HomeClient";
import type { Metadata } from "next";
import { PUBLIC_URL } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Vestidos de Fiesta en Lima | Showroom en San Isidro",
  description: "Encuentra vestidos elegantes e importados en nuestro showroom de San Isidro. Diseños exclusivos para tus eventos en Lima, Perú.",
  openGraph: {
    title: "Vestidos de Fiesta en Lima | Showroom en San Isidro",
    description: "Encuentra vestidos elegantes e importados en nuestro showroom de San Isidro. Diseños exclusivos para tus eventos en Lima, Perú.",
    url: PUBLIC_URL,
    type: "website",
    images: [
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

async function fetchInitialData() {
  const [garmentsRes, postsRes, faqsRes] = await Promise.all([
    fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || ''}/api/products?limit=10`, { cache: 'no-store' }),
    fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || ''}/api/posts?limit=6`, { cache: 'no-store' }),
    fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || ''}/api/faqs?limit=${process.env.NEXT_PUBLIC_FAQ_LIMIT || 5}&estado=activa&order=asc`, { cache: 'no-store' })
  ]);
  const [garments, posts, faqs] = await Promise.all([
    garmentsRes.ok ? garmentsRes.json() : [],
    postsRes.ok ? postsRes.json() : [],
    faqsRes.ok ? faqsRes.json() : [],
  ]);
  return { garments, posts, faqs };
}

export default async function Home() {
  const { garments, posts, faqs } = await fetchInitialData();
  return <HomeClient initialGarments={garments} initialPosts={posts} initialFaqs={faqs} />;
}
