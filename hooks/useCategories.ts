import { useState, useCallback } from 'react';
import { Category } from '@/types/category';

export const useCategories = () => {
    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchCategories = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await fetch("/api/posts/categories");
            if (!res.ok) throw new Error("Error al cargar categorías");
            const data = await res.json();
            const categoriesArray = Array.isArray(data) ? data : (data.categories || []);
            setCategories(categoriesArray);
        } catch (err: any) {
            console.error("Failed to load categories", err);
            setError(err.message || 'Error al obtener categorías');
        } finally {
            setIsLoading(false);
        }
    }, []);

    return {
        categories,
        isLoading,
        error,
        fetchCategories,
        setCategories
    };
};
