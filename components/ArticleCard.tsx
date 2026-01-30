import React from 'react';
import type { Post } from '../interfaces/post';

interface ArticleCardProps {
  article: Post;
  navigate: (path: string) => void;
}

const ArticleCard: React.FC<ArticleCardProps> = ({ article, navigate }) => {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    if (article.slug) {
      navigate(`/blog/${article.slug}`);
    }
  };

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('es-ES', options);
  };

  return (
    <a
      href={`/blog/${article.slug}`}
      onClick={handleClick}
      className="group block bg-white rounded-lg shadow-lg overflow-hidden transform transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-offset-2 focus:ring-stone-500 flex flex-col h-full"
    >
      <div className="relative aspect-[16/9] overflow-hidden">
        <img
          src={article.featured_image_url}
          alt={`Imagen destacada para ${article.title}`}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-60 group-hover:opacity-40 transition-opacity duration-300"></div>
        {article.categories && article.categories.length > 0 && (
          <div className="absolute top-4 left-4 flex flex-wrap gap-2">
            {article.categories.map(cat => (
              <span key={cat.id} className="bg-white/90 backdrop-blur-sm text-stone-800 text-xs font-semibold px-2 py-1 rounded-full shadow-sm">
                {cat.name}
              </span>
            ))}
          </div>
        )}
      </div>
      <div className="p-6 flex flex-col flex-grow">
        <div className="flex items-center text-xs text-stone-500 mb-2 space-x-2">
          <time dateTime={article.published_at}>{formatDate(article.published_at)}</time>
          <span>•</span>
          <span>{article.reading_time} min de lectura</span>
        </div>
        <h2 className="text-xl font-semibold text-stone-800 mb-3 leading-tight group-hover:text-stone-900 transition-colors line-clamp-2">
          {article.title}
        </h2>
        <p className="text-stone-600 text-sm leading-relaxed mb-4 line-clamp-3">
          {article.seo_description}
        </p>
        <div className="mt-auto">
          <span className="inline-block text-sm font-bold text-sky-600 group-hover:underline">Leer más &rarr;</span>
        </div>
      </div>
    </a>
  );
};

export default ArticleCard;