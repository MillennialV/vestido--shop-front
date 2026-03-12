"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Category } from '@/types/category';

interface CategoryContextType {
    categories: Category[];
    isLoading: boolean;
    error: string | null;
    fetchCategories: () => Promise<void>;
    createCategory: (name: string) => Promise<boolean>;
    updateCategory: (id: number | string, name: string) => Promise<boolean>;
    deleteCategory: (id: number | string) => Promise<boolean>;
    clearError: () => void;
}

const CategoryContext = createContext<CategoryContextType | undefined>(undefined);

export const CategoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const clearError = useCallback(() => {
        setError(null);
    }, []);

    const fetchCategories = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await fetch("/api/posts/categories");
            if (!res.ok) {
                setCategories([]);
                return;
            }
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

    const createCategory = async (name: string) => {
        // Verificar si ya existe una categoría con ese nombre (case-insensitive)
        const exists = categories.some(cat => cat.name.toLowerCase() === name.toLowerCase());
        if (exists) {
            setError("La categoría ya existe");
            return false;
        }

        setIsLoading(true);
        setError(null);
        try {
            const res = await fetch("/api/posts/categories", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name }),
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Error al crear categoría");
            }
            await fetchCategories();
            return true;
        } catch (err: any) {
            setError(err.message);
            return false;
        } finally {
            setIsLoading(false);
        }
    };

    const updateCategory = async (id: number | string, name: string) => {
        // Verificar duplicados excluyendo la categoría que se está editando
        const exists = categories.some(cat => cat.id !== id && cat.name.toLowerCase() === name.toLowerCase());
        if (exists) {
            setError("Ya existe otra categoría con este nombre");
            return false;
        }

        setIsLoading(true);
        setError(null);
        try {
            const res = await fetch(`/api/posts/categories?id=${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name }),
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Error al actualizar categoría");
            }
            await fetchCategories();
            return true;
        } catch (err: any) {
            setError(err.message);
            return false;
        } finally {
            setIsLoading(false);
        }
    };

    const deleteCategory = async (id: number | string) => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await fetch(`/api/posts/categories?id=${id}`, {
                method: "DELETE",
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Error al eliminar categoría");
            }
            await fetchCategories();
            return true;
        } catch (err: any) {
            setError(err.message);
            return false;
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

    return (
        <CategoryContext.Provider value={{
            categories,
            isLoading,
            error,
            fetchCategories,
            createCategory,
            updateCategory,
            deleteCategory,
            clearError
        }}>
            {children}
        </CategoryContext.Provider>
    );
};

export const useCategoryContext = () => {
    const context = useContext(CategoryContext);
    if (!context) {
        throw new Error('useCategoryContext must be used within a CategoryProvider');
    }
    return context;
};
