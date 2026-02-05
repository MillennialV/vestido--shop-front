"use client";
import React, { useEffect, useState, use as useReact } from "react";
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
  const router = useRouter();

  useEffect(() => {
    const fetchPost = async () => {
      try {
        setIsLoading(true);
        setError(null); // Limpiamos errores previos

        const res = await fetch('/api/posts?limit=100');
        if (!res.ok) throw new Error('Error al cargar posts');

        const data = await res.json();

        // IMPORTANTE: Accedemos a la propiedad posts del objeto
        const postsArray = data.posts || [];

        const foundPost = postsArray.find((p: Post) => p.slug === slug);

        if (!foundPost) {
          setError("Post no encontrado");
          return;
        }

        setPost(foundPost);
      } catch (err) {
        console.error("Error fetching post:", err);
        setError("Error al cargar el post");
      } finally {
        setIsLoading(false);
      }
    };
    fetchPost();
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
          onClick={() => router.push("/")}
          className="flex items-center gap-2 text-stone-400 hover:text-stone-900 dark:hover:text-white mb-8"
        >
          <ArrowLeftIcon className="w-5 h-5" /> Volver al blog
        </button>
        <h1 className="text-3xl text-stone-500 dark:text-stone-300  font-bold mb-4 break-words break-all whitespace-pre-wrap">
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
          <img
            src={post.featured_image_url}
            alt={post.title}
            className="w-full max-h-96 object-cover rounded-lg mb-8"
          />
        )}
        <div
          className="prose prose-stone dark:prose-invert max-w-none break-words break-all whitespace-pre-wrap"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />
      </main>
    </div>
  );
}
