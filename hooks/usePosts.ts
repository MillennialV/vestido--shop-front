import { useState, useCallback } from 'react';
import { postService } from '../services/postService';
import { Post } from '@/interfaces/post';
import { Pagination } from '@/interfaces/pagination';

export const usePosts = () => {

    const [posts, setPosts] = useState<Post[]>([]);
    const [pagination, setPagination] = useState<Pagination>({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchPosts = useCallback(async (params: { page?: number; limit?: number } = {}) => {
        setIsLoading(true);
        setError(null);
        try {
            const { posts, pagination } = await postService.readPosts(params);
            setPosts(posts);
            setPagination(pagination);
        } catch (err: any) {
            setError(err.message || 'Error al obtener productos');
        } finally {
            setIsLoading(false);
        }
    }, []);

    const fetchPostById = useCallback(async (id: number | string): Promise<Post | null> => {
        setIsLoading(true);
        setError(null);
        try {
            const post = await postService.readPost(id);
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
            const newPost = await postService.createPost(postData);

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
            const updatedPost = await postService.updatePost(id, postData);

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
            await postService.deletePost(id);

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
        deletePost
    };
    
}