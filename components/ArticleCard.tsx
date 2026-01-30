import React, { useRef } from 'react';
import type { Article } from '../types';

interface ArticleCardProps {
  article: Article;
  navigate: (path: string) => void;
}

const ArticleCard: React.FC<ArticleCardProps> = ({ article, navigate }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleMouseEnter = () => {
    const playPromise = videoRef.current?.play();
    if (playPromise !== undefined) {
      playPromise.catch(error => {
        // Ignore AbortError which is triggered when pause() interrupts play().
        if (error.name !== 'AbortError') {
          console.error("Article card video play failed:", error);
        }
      });
    }
  };

  const handleMouseLeave = () => {
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  };

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    if (article.slug) {
      navigate(`/blog/${article.slug}`);
    }
  };

  return (
    <a 
      href={`/blog/${article.slug}`}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="group block bg-white rounded-lg shadow-lg overflow-hidden transform transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-offset-2 focus:ring-stone-500"
    >
      <div className="relative aspect-[9/16] overflow-hidden">
        <video
          ref={videoRef}
          src={article.image_url}
          loop
          muted
          playsInline
          preload="metadata"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        >
          <title>Vista previa para el artículo {article.title}</title>
        </video>
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
      </div>
      <div className="p-6">
        <h2 className="text-2xl font-semibold text-stone-800 mb-2 leading-tight group-hover:text-stone-900 transition-colors">{article.title}</h2>
        <p className="text-stone-600 text-sm leading-relaxed">{article.excerpt}</p>
        <span className="inline-block mt-4 text-sm font-bold text-sky-600 group-hover:underline">Leer más</span>
      </div>
    </a>
  );
};

export default ArticleCard;