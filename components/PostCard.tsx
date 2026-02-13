import React from "react";
import Link from "next/link";
import Image from "next/image";
import type { Post } from "../types/post";
import { EditIcon, DeleteIcon } from "./Icons";
import { useAuth } from "@/hooks/useAuth";

interface PostCardProps {
  post: Post;
  navigate?: (path: string) => void;
  onEdit?: (post: Post) => void;
  onDelete?: (post: Post) => void;
}

const PostCard: React.FC<PostCardProps> = ({
  post,
  navigate,
  onEdit,
  onDelete,
}) => {

  const { authenticated } = useAuth();

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'Aún no publicado';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Fecha inválida';

    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };
    return date.toLocaleDateString('es-ES', options);
  };

  return (
    <Link
      href={`/posts/${post.slug}`}
      className="group flex flex-col h-full bg-white dark:bg-stone-800/50 rounded-xl overflow-hidden border border-stone-100 dark:border-stone-700 hover:border-stone-300 dark:hover:border-stone-500 transition-all duration-300 hover:shadow-xl"
    >
      <div className="relative aspect-[16/10] overflow-hidden">
        <Image
          src={post.featured_image_url}
          alt={post.title}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover object-top transition-transform duration-700 ease-out group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors duration-300" />

        <div className="absolute top-4 left-4 flex flex-wrap gap-2 z-10">
          {!post.is_published && (
            <span className="backdrop-blur-md bg-yellow-400/90 text-yellow-900 text-[10px] uppercase tracking-wider font-bold px-3 py-1 rounded-full shadow-sm">
              Borrador
            </span>
          )}
          {post.categories && post.categories.length > 0 && post.categories.map(cat => (
            <span
              key={cat.id}
              className="backdrop-blur-md bg-white/90 dark:bg-black/60 text-stone-900 dark:text-stone-100 text-[10px] uppercase tracking-wider font-bold px-3 py-1 rounded-full shadow-sm"
            >
              {cat.name}
            </span>
          ))}
        </div>

        {/* Admin Controls */}
        {authenticated && (
          <div className="absolute top-4 right-4 flex gap-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            {onEdit && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onEdit(post);
                }}
                className="p-2 bg-white text-stone-700 hover:text-sky-600 rounded-full shadow-lg hover:bg-stone-50 transition-colors"
                aria-label={`Editar ${post.title}`}
              >
                <EditIcon className="w-4 h-4" />
              </button>
            )}
            {onDelete && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onDelete(post);
                }}
                className="p-2 bg-white text-stone-700 hover:text-red-600 rounded-full shadow-lg hover:bg-stone-50 transition-colors"
                aria-label={`Eliminar ${post.title}`}
              >
                <DeleteIcon className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>

      <div className="p-6 flex flex-col flex-grow relative">
        <div className="flex items-center gap-3 text-xs font-medium text-stone-400 uppercase tracking-wider mb-3">
          <time dateTime={post.created_at}>
            {formatDate(post.updated_at || post.created_at)}
          </time>
          <span className="w-1 h-1 rounded-full bg-stone-300 dark:bg-stone-600" />
          <span>{post.reading_time} min</span>
        </div>

        <h2 className="text-xl md:text-2xl font-bold text-stone-900 dark:text-stone-100 mb-3 leading-tight group-hover:text-stone-600 dark:group-hover:text-stone-300 transition-colors">
          {post.title}
        </h2>

        <p className="text-stone-600 dark:text-stone-400 text-sm leading-relaxed mb-6 line-clamp-3">
          {post.seo_description}
        </p>

        <div className="mt-auto flex items-center text-sm font-semibold text-stone-900 dark:text-stone-100 group-hover:underline decoration-1 underline-offset-4">
          Leer artículo
          <svg
            className="w-4 h-4 ml-1 transition-transform duration-300 group-hover:translate-x-1"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </div>
      </div>
    </Link >
  );
};

export default PostCard;
