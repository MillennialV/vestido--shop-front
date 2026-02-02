import React from 'react';
import PostCard from './PostCard';
import type { Post } from '../types/post';
import { PlusIcon } from './Icons';

interface BlogProps {
    posts: Post[];
    navigate: (path: string) => void;
    isAdmin?: boolean;
    onAddPost?: () => void;
    onEditPost?: (post: Post) => void;
    onDeletePost?: (post: Post) => void;
}

const Blog: React.FC<BlogProps> = ({ posts, navigate, isAdmin, onAddPost, onEditPost, onDeletePost }) => {
    return (
        <div className="animate-fade-in-down">
            <header className="text-center mb-12">
                <h1 className="text-5xl md:text-6xl font-semibold text-stone-900 dark:text-stone-100 tracking-wider">Nuestro Blog</h1>
                <p className="mt-4 text-lg text-stone-500 dark:text-stone-400 max-w-2xl mx-auto">
                    Inspiración, estilo y las historias detrás de cada diseño. Sumérgete en el universo de Womanity Boutique.
                </p>
                {isAdmin && onAddPost && (
                    <div className="mt-8 flex justify-center">
                        <button
                            onClick={onAddPost}
                            className="inline-flex items-center gap-2 bg-stone-800 dark:bg-stone-700 text-white font-semibold py-2.5 px-5 rounded-lg hover:bg-stone-700 dark:hover:bg-stone-600 active:bg-stone-900 dark:active:bg-stone-800 transition-all duration-200 text-sm shadow-md hover:shadow-lg"
                        >
                            <PlusIcon className="w-4 h-4" />
                            <span>Crear Artículo</span>
                        </button>
                    </div>
                )}
            </header>

            {posts && posts.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12">
                    {posts.map(post => (
                        <PostCard
                            key={post.id}
                            post={post}
                            navigate={navigate}
                            isAdmin={isAdmin}
                            onEdit={onEditPost}
                            onDelete={onDeletePost}
                        />
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

export default Blog;
