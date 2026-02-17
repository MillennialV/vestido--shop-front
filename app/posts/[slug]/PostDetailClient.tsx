"use client";
import React, { useEffect, useState, use as useReact } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import type { Post } from "@/types/post";
import { ArrowLeftIcon } from "@/components/Icons";
import LoadingOverlay from "@/components/LoadingOverlay";

export default function PostDetailClient({ slug }: { slug: string }) {
  const [post, setPost] = useState<Post | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [relatedPosts, setRelatedPosts] = useState<Post[]>([]);
  const router = useRouter();

  useEffect(() => {
    const fetchPostAndRelated = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const res = await fetch('/api/posts?limit=100');
        if (!res.ok) throw new Error('Error al cargar posts');

        const data = await res.json();
        const postsArray: Post[] = data.posts || [];

        const foundPost = postsArray.find((p: Post) => p.slug === slug);

        if (!foundPost) {
          setError("Post no encontrado");
          return;
        }

        setPost(foundPost);
        // Filtrar el post actual y tomar 3 relacionados
        const others = postsArray
          .filter((p: Post) => p.slug !== slug)
          .slice(0, 3);
        setRelatedPosts(others);

      } catch (err) {
        console.error("Error fetching post data:", err);
        setError("Error al cargar el contenido");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPostAndRelated();
  }, [slug]);

  const handleNavigate = (path: string) => {
    router.push(path);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-stone-900">
        <Header
          isAdmin={isAdmin}
          onToggleAdmin={() => setIsAdmin(!isAdmin)}
          navigate={handleNavigate}
        />
        <LoadingOverlay isOpen={true} message="Cargando artículo..." />
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-stone-900 text-white">
        <Header
          isAdmin={isAdmin}
          onToggleAdmin={() => setIsAdmin(!isAdmin)}
          navigate={handleNavigate}
        />
        <main className="max-w-4xl mx-auto px-4 py-20">
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-2 text-stone-400 hover:text-white mb-8"
          >
            <ArrowLeftIcon className="w-5 h-5" /> Volver al blog
          </button>
          <h1 className="text-2xl font-bold mb-4">
            {error || "Post no encontrado"}
          </h1>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-900">
      <Header
        isAdmin={isAdmin}
        onToggleAdmin={() => setIsAdmin(!isAdmin)}
        navigate={handleNavigate}
      />
      <main className="max-w-4xl mx-auto px-4 py-12">
        <button
          onClick={() => router.push("/#blog")}
          className="flex items-center gap-2 text-stone-400 hover:text-stone-900 dark:hover:text-white mb-8"
        >
          <ArrowLeftIcon className="w-5 h-5" /> Volver al blog
        </button>
        <h1 className="text-3xl text-stone-900 dark:text-stone-100 font-bold mb-4">
          {post.title}
        </h1>
        <div className="mb-6 text-stone-500 dark:text-stone-300 text-sm">
          {post.updated_at && (
            <span>
              Publicado el{" "}
              {new Date(post.updated_at).toLocaleDateString("es-PE", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
          )}
        </div>
        {post.featured_image_url && (
          <div className="relative w-full aspect-video max-h-[400px] overflow-hidden rounded-xl mb-8 shadow-md">
            <Image
              src={post.featured_image_url}
              alt={post.title}
              fill
              priority
              sizes="(max-width: 896px) 100vw, 896px"
              className="object-cover"
            />
          </div>
        )}
        <div
          className="prose prose-stone dark:prose-invert max-w-none w-full break-words overflow-x-hidden text-stone-900 dark:text-stone-100"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />
        <style dangerouslySetInnerHTML={{
          __html: `
          .prose * {
            background-color: transparent !important;
            white-space: normal !important;
            word-break: break-word !important;
          }
          :root:not(.dark) .prose :is(p, h1, h2, h3, h4, h5, h6, span, li, em, strong) {
            color: #1c1917 !important;
          }
        ` }} />

        <hr className="my-12 border-stone-200 dark:border-stone-800" />

        {relatedPosts.length > 0 && (
          <section className="mt-12">
            <h2 className="text-2xl font-bold text-stone-900 dark:text-stone-100 mb-8">
              Artículos recomendados
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {relatedPosts.map((rPost) => (
                <article
                  key={rPost.id}
                  onClick={() => router.push(`/posts/${rPost.slug}`)}
                  className="group cursor-pointer bg-white dark:bg-stone-800 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow ring-1 ring-stone-200 dark:ring-stone-700"
                >
                  {rPost.featured_image_url && (
                    <div className="relative aspect-video overflow-hidden">
                      <Image
                        src={rPost.featured_image_url}
                        alt={rPost.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                  )}
                  <div className="p-4">
                    <h3 className="font-bold text-stone-900 dark:text-stone-100 group-hover:text-stone-600 dark:group-hover:text-stone-300 transition-colors line-clamp-2">
                      {rPost.title}
                    </h3>
                  </div>
                </article>
              ))}
            </div>
            <div className="mt-12 text-center">
              <button
                onClick={() => router.push("/#blog")}
                className="px-8 py-3 border-2 border-stone-900 dark:border-stone-100 text-stone-900 dark:text-stone-100 rounded-full font-bold hover:bg-stone-900 hover:text-white dark:hover:bg-white dark:hover:text-stone-900 transition-all"
              >
                Ver todo el blog
              </button>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
