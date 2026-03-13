import { useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';

export interface Banner {
    id: string;
    title: string;
    image_url: string;
    is_active: boolean;
    order_index: number;
}

export const useBanners = () => {
    const { authenticated, organization } = useAuth();
    const [banners, setBanners] = useState<Banner[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchBanners = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            // Si está autenticado, jala todos (activos e inactivos). Si no, solo activos.
            const endpoint = authenticated ? '/api/banners/admin' : '/api/banners';
            const headers: Record<string, string> = {};
            
            let url = endpoint;
            if (!authenticated) {
                // Para usuarios públicos, enviamos el dominio actual
                const domain = window.location.hostname;
                url += `?domain=${domain}`;
            }

            const response = await fetch(url, { headers });
            if (!response.ok) throw new Error('Error al cargar los banners');

            const result = await response.json();
            // El backend envuelve la respuesta en { success: true, data: [...] }
            setBanners(result?.data || []);
        } catch (err: any) {
            console.error('Error fetching banners:', err);
            setError(err.message || 'Error desconocido');
        } finally {
            setIsLoading(false);
        }
    }, [authenticated]);

    const uploadBanner = async (file: File, title: string) => {
        try {
            const formData = new FormData();
            formData.append('image', file);
            formData.append('title', title);
            formData.append('is_active', 'true');
            // Ya no enviamos organization_id manualmente, el backend lo saca del token

            const response = await fetch('/api/banners', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) throw new Error('Error subiendo banner');

            await fetchBanners(); // Recargar después de subir
            return true;
        } catch (err) {
            console.error('Error uploadBanner:', err);
            throw err;
        }
    };

    const deleteBanner = async (id: string) => {
        try {
            // Ya no enviamos organization_id manualmente
            const response = await fetch(`/api/banners?id=${id}`, {
                method: 'DELETE',
            });
            if (!response.ok) throw new Error('Error eliminando banner');

            setBanners(prev => prev.filter(b => b.id !== id));
            return true;
        } catch (err) {
            console.error('Error deleteBanner:', err);
            throw err;
        }
    };

    const updateBanner = async (id: string, updates: Partial<Banner>, file?: File) => {
        try {
            const formData = new FormData();
            formData.append('id', id);
            if (updates.title !== undefined) formData.append('title', updates.title);
            if (updates.is_active !== undefined) formData.append('is_active', String(updates.is_active));
            if (updates.order_index !== undefined) formData.append('order_index', String(updates.order_index));
            // Ya no enviamos organization_id manualmente
            if (file) formData.append('image', file);

            const response = await fetch(`/api/banners`, {
                method: 'PUT',
                body: formData,
            });

            if (!response.ok) throw new Error('Error actualizando banner');

            await fetchBanners(); // Recargar después de actualizar
            return true;
        } catch (err) {
            console.error('Error updateBanner:', err);
            throw err;
        }
    };

    return {
        banners,
        isLoading,
        error,
        fetchBanners,
        uploadBanner,
        deleteBanner,
        updateBanner
    };
};
