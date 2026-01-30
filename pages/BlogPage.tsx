import React from 'react';
import type { Article } from '../types';
import ArticleCard from '../components/ArticleCard';

interface BlogPageProps {
  articles: Article[];
  navigate: (path: string) => void;
}

const BlogPage: React.FC<BlogPageProps> = ({ articles, navigate }) => {
  return (
    <div className="animate-fade-in-down">
      <header className="text-center mb-12">
        <h1 className="text-5xl md:text-6xl font-semibold text-stone-900 dark:text-stone-100 tracking-wider">Nuestro Blog</h1>
        <p className="mt-4 text-lg text-stone-500 dark:text-stone-400 max-w-2xl mx-auto">
          Inspiración, estilo y las historias detrás de cada diseño. Sumérgete en el universo de Womanity Boutique.
        </p>
      </header>
      
      {articles.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12">
          {articles.map(article => (
            <ArticleCard key={article.id} article={article} navigate={navigate} />
          ))}
        </div>
      ) : (
        <p className="text-center text-lg text-stone-500 dark:text-stone-400 py-16">
          Aún no hemos publicado ningún artículo. ¡Vuelve pronto!
        </p>
      )}
    </div>
  );
};

export default BlogPage;
