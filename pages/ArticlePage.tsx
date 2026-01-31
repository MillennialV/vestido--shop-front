import React from 'react';
import type { Article } from '@/interfaces/Article';
import type { Garment } from '@/interfaces/Garment';
import VideoCard from '../components/VideoCard';
import { ArrowLeftIcon } from '../components/Icons';

interface ArticlePageProps {
  data: {
    article: Article;
    garment: Garment;
  };
  navigate: (path: string) => void;
}

const ArticlePage: React.FC<ArticlePageProps> = ({ data, navigate }) => {
  const { article, garment } = data;

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, path: string) => {
    e.preventDefault();
    navigate(path);
  };

  const handleGarmentSelect = () => {
    if (garment && garment.slug) {
      navigate(`/${garment.slug}`);
    }
  };

  return (
    <div className="max-w-4xl mx-auto animate-fade-in-down">
      <a
        href="/blog"
        onClick={(e) => handleLinkClick(e, '/blog')}
        className="inline-flex items-center gap-2 text-stone-600 hover:text-stone-900 transition-colors mb-8 font-semibold"
      >
        <ArrowLeftIcon className="w-5 h-5" />
        Volver al Blog
      </a>

      <article>
        <h1 className="text-4xl md:text-5xl font-bold text-stone-900 leading-tight mb-4">{article.title}</h1>
        <p className="text-lg text-stone-500 mb-8">{article.excerpt}</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div
            className="md:col-span-2 prose prose-lg max-w-none text-stone-800 prose-headings:text-stone-900 prose-strong:text-stone-900"
            dangerouslySetInnerHTML={{ __html: article.content }}
          />
          <aside className="md:col-span-1">
            <div className="sticky top-24">
              <h3 className="text-xl font-semibold text-stone-800 mb-4">Comprar este look</h3>
              <VideoCard
                garment={garment}
                onSelect={handleGarmentSelect}
                isAdmin={false}
                onEdit={() => { }}
                onDelete={() => { }}
                isSelectionMode={false}
                isSelected={false}
                onToggleSelection={() => { }}
              />
            </div>
          </aside>
        </div>
      </article>
      <style>{`
        .prose ul { list-style-type: disc; padding-left: 1.5rem; }
        .prose li { margin-bottom: 0.5rem; }
      `}</style>
    </div>
  );
};

export default ArticlePage;