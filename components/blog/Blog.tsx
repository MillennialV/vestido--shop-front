import React from 'react';
import PostCard from "@/components/blog/PostCard";
import type { Post } from '@/types/post';
import { PlusIcon } from '@/components/ui/Icons';
import { useAuth } from '@/hooks/useAuth';
import SimplePagination from '@/components/ui/SimplePagination';

interface BlogProps {
    posts: Post[];
    navigate: (path: string) => void;
    onAddPost?: () => void;
    onAddPostClick?: () => void;
    onEditPost?: (post: Post) => void;
    onDeletePost?: (post: Post) => void;
    isLoading?: boolean;
    pagination?: {
        page: number;
        hasNextPage: boolean;
        onPageChange: (page: number) => void;
    };
}

const Blog: React.FC<BlogProps> = ({ posts, navigate, onAddPost, onEditPost, onDeletePost, isLoading, pagination }) => {

    const { authenticated } = useAuth();

    return (
        <div className="animate-fade-in-down mb-24">
            <header className="text-center mb-[18px]">
                <h1 className="font-h1">Nuestro Blog</h1>
                <p className="font-p mt-[28px] w-[60%] mx-auto">
                    Inspiración, estilo y las historias detrás de cada diseño. Sumérgete en el universo de Womanity Boutique.
                </p>
                {authenticated && (
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

            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-[71px]">
                    <div className="w-8 h-8 border-4 border-stone-200 border-t-stone-800 rounded-full animate-spin mb-4"></div>
                    <p className="font-p">Cargando artículos...</p>
                </div>
            ) : posts && posts.length > 0 ? (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12 py-[71px]">
                        {posts.map(post => (
                            <PostCard
                                key={post.id}
                                post={post}
                                navigate={navigate}
                                onEdit={onEditPost}
                                onDelete={onDeletePost}
                            />
                        ))}
                    </div>

                    {pagination && (
                        <SimplePagination
                            currentPage={pagination.page}
                            hasNextPage={pagination.hasNextPage}
                            onPageChange={pagination.onPageChange}
                        />
                    )}
                </>
            ) : (
                <div className="text-center py-[71px] bg-stone-50 dark:bg-stone-900 rounded-lg">
                    <p className="font-p">
                        Aún no hemos publicado ningún artículo. ¡Vuelve pronto!
                    </p>
                </div>
            )}
        </div>
    );
};

export default Blog;
