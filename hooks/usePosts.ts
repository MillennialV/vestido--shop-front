import { useState, useCallback, useEffect } from 'react';
// import eliminado: postService
import { Pagination } from '@/types/pagination';
import { Post, BlogPagination } from '@/types/post';

export const usePosts = () => {

    const [posts, setPosts] = useState<Post[]>([]);
    const [pagination, setPagination] = useState<BlogPagination>({
        page: 1,
        limit: 10,
        hasNextPage: false
    });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchPosts = useCallback(async (params: { page?: number; limit?: number } = {}) => {
        setIsLoading(true);
        setError(null);
        try {
            const page = params.page || 1;
            const limit = params.limit || 10;
            const res = await fetch(`/api/posts?page=${page}&limit=${limit}`);
            if (!res.ok) throw new Error('Error al obtener posts');
            const data = await res.json();
            const postsArr = Array.isArray(data) ? data : data.posts || [];
            const paginationObj = data.pagination || { page, limit, total: postsArr.length, totalPages: 1 };
            setPosts(postsArr);
            setPagination(paginationObj);
        } catch (err: any) {
            setError(err.message || 'Error al obtener productos');
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Load posts on mount
    useEffect(() => {
        fetchPosts();
    }, [fetchPosts]);

    const fetchPostById = useCallback(async (id: number | string): Promise<Post | null> => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await fetch(`/api/posts?id=${id}`);
            if (!res.ok) throw new Error('Error al obtener post');
            const post = await res.json();
            return post;
        } catch (err: any) {
            setError(err.message || 'Error al obtener producto');
            return null;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const createPost = async (
        postData: Post
    ): Promise<Post | null> => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/posts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(postData),
            });
            if (!res.ok) throw new Error('Error al crear el post');
            const newPost = await res.json();
            setPosts((prev: Post[]) => [newPost, ...prev]);
            return newPost;
        } catch (err: any) {
            setError(err.message || 'Error al crear el producto');
            return null;
        } finally {
            setIsLoading(false);
        }
    };

    const updatePost = async (
        id: number | string,
        postData: Partial<Post>
    ): Promise<Post | null> => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await fetch(`/api/posts?id=${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(postData),
            });
            if (!res.ok) throw new Error('Error al actualizar el post');
            const updatedPost = await res.json();
            setPosts((prev: Post[]) => prev.map(p => (p.id === updatedPost.id ? updatedPost : p)));
            return updatedPost;
        } catch (err: any) {
            setError(err.message || 'Error al actualizar el producto');
            return null;
        } finally {
            setIsLoading(false);
        }
    };

    const deletePost = async (id: number | string): Promise<void> => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await fetch(`/api/posts?id=${id}`, {
                method: 'DELETE',
            });
            if (!res.ok) throw new Error('Error al eliminar el post');
            setPosts((prev: Post[]) => prev.filter(p => p.id !== id && String(p.id) !== String(id)));
        } catch (err: any) {
            setError(err.message || 'Error al eliminar el producto');
        } finally {
            setIsLoading(false);
        }
    };

    return {
        posts,
        pagination,
        isLoading,
        error,
        fetchPosts,
        fetchPostById,
        createPost,
        updatePost,
        deletePost,
        setPosts
    };

}