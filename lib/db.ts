import type { Garment } from '@/types/Garment';
import type { Article } from '@/types/Article';
import { defaultGarments } from './defaultGarments';
import { slugify } from './slugify';

// URL del backend API desde variables de entorno (para upload de videos y otros servicios)
const API_BASE_URL = process.env.NEXT_PUBLIC_API_INVENTARIO_BASE_URL || 'http://localhost:3005';

// Garment Functions
/**
 * Obtener lista de productos desde el servicio de inventario
 * Llama al endpoint: GET /api/producto/obtener-listado-productos
 */
export async function getListProducts(page: number = 1, limit: number = 100, sort: string = 'title', order: 'asc' | 'desc' = 'desc'): Promise<Garment[]> {
    try {
        const res = await fetch(`/api/products?page=${page}&limit=${limit}&sort=${sort}&order=${order}`);
        if (!res.ok) throw new Error('Error al obtener productos');
        const data = await res.json();
        const products = Array.isArray(data) ? data : data.products || [];
        if (!products || products.length === 0) {
            console.warn('[getListProducts] No hay productos, usando datos por defecto');
            return defaultGarments;
        }
        return products;
    } catch (error) {
        console.error('Error fetching products:', error);
        return defaultGarments;
    }
}

// Alias para mantener compatibilidad con código existente
export const getGarments = getListProducts;

export async function uploadVideoFile(videoFile: File, onProgress: (percentage: number) => void): Promise<string> {
    const formData = new FormData();
    formData.append('video', videoFile);

    console.log('[uploadVideoFile] Intentando subir video:', {
        fileName: videoFile.name,
        fileSize: videoFile.size,
        fileType: videoFile.type,
        endpoint: `${API_BASE_URL}/api/upload/video`
    });

    try {
        const response = await fetch(`${API_BASE_URL}/api/upload/video`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken') || ''}`,
                // No establecer Content-Type, el navegador lo hace automáticamente para FormData
            },
            body: formData,
        });

        if (!response.ok) {
            let errorData;
            const responseText = await response.text();
            try {
                errorData = JSON.parse(responseText);
            } catch (e) {
                errorData = {
                    message: responseText || response.statusText,
                    statusText: response.statusText,
                    status: response.status
                };
            }

            throw new Error(errorData.message || errorData.error || `Error al subir el video: ${response.status}`);
        }

        const data = await response.json();
        const videoUrl = data.url || data.publicUrl || data.videoUrl;

        if (!videoUrl) {
            console.error('[uploadVideoFile] Respuesta sin URL:', data);
            throw new Error('El servidor no devolvió una URL para el video subido');
        }

        console.log('[uploadVideoFile] Video subido exitosamente:', videoUrl);
        return videoUrl;
    } catch (error) {
        console.error('[uploadVideoFile] Error completo:', error);
        throw error;
    }
}

async function deleteVideoFile(videoUrl: string): Promise<void> {
    if (!videoUrl) return;
    try {
        // Extraer el path del video de la URL
        const videoPath = videoUrl.split('/').pop();
        if (videoPath) {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`${API_BASE_URL}/api/upload/video/${encodeURIComponent(videoPath)}`, {
                method: 'DELETE',
                headers: {
                    ...(token && { 'Authorization': `Bearer ${token}` }),
                },
            });
            if (!response.ok) {
                throw new Error(`Error al eliminar video: ${response.status}`);
            }
        }
    } catch (removeError) {
        console.error('Failed to remove old video, continuing...', removeError);
        // No lanzar error, solo loguear
    }
}

async function saveGarmentData(
    garmentData: Omit<Garment, 'id' | 'slug' | 'created_at'> & { id?: number },
): Promise<Garment> {
    const { id, ...restOfGarmentData } = garmentData;
    let savedData: Garment;
    if (id) {
        // Actualizar prenda existente
        const res = await fetch('/api/products', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, ...restOfGarmentData }),
        });
        if (!res.ok) throw new Error('Error al actualizar producto');
        savedData = await res.json();
    } else {
        // Crear nueva prenda
        const res = await fetch('/api/products', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(restOfGarmentData),
        });
        if (!res.ok) throw new Error('Error al crear producto');
        savedData = await res.json();
    }
    // Actualizar slug si es necesario
    const newSlug = slugify(savedData.title, savedData.id);
    if (savedData.slug !== newSlug) {
        try {
            const res = await fetch('/api/products', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: savedData.id, slug: newSlug }),
            });
            if (res.ok) savedData = await res.json();
        } catch (updateError) {
            console.warn("Failed to update slug, but continuing...", updateError);
        }
    }
    return savedData;
}

export async function saveGarment(
    garmentData: Omit<Garment, 'id' | 'videoUrl' | 'slug' | 'created_at'> & { id?: number },
    videoFile: File | null,
    existingVideoUrl?: string
): Promise<Garment> {
    let finalVideoUrl = existingVideoUrl || '';

    // Si hay un archivo de video, intentar subirlo
    if (videoFile) {
        try {
            console.log('[saveGarment] Subiendo video...', { fileName: videoFile.name, size: videoFile.size });
            finalVideoUrl = await uploadVideoFile(videoFile, () => { });
            console.log('[saveGarment] Video subido exitosamente:', finalVideoUrl);

            // Si se subió exitosamente y había un video anterior, eliminarlo
            if (existingVideoUrl && finalVideoUrl !== existingVideoUrl) {
                await deleteVideoFile(existingVideoUrl);
            }
        } catch (error) {
            console.error('[saveGarment] Error al subir video:', error);
            const errorMessage = error instanceof Error ? error.message : String(error);

            // Si falla el upload, verificar si hay una URL existente
            if (existingVideoUrl) {
                console.warn('[saveGarment] Usando URL de video existente debido a error en upload');
                finalVideoUrl = existingVideoUrl;
            } else {
                // Si no hay URL existente y el upload falla, lanzar error claro
                // El usuario debe saber que necesita el endpoint de upload o una URL externa
                throw new Error(
                    `No se pudo subir el video al servidor. ${errorMessage}\n\n` +
                    `Por favor, verifica que:\n` +
                    `1. El endpoint /api/upload/video esté disponible en tu backend\n` +
                    `2. O proporciona una URL externa de video (YouTube, Vimeo, etc.)`
                );
            }
        }
    }

    // Si no hay videoUrl, usar el que viene en garmentData (puede ser una URL externa)
    if (!finalVideoUrl && (garmentData as any).videoUrl) {
        finalVideoUrl = (garmentData as any).videoUrl;
    }

    // Validar que tengamos un videoUrl antes de guardar
    if (!finalVideoUrl || finalVideoUrl.trim() === '') {
        throw new Error('Se requiere un video para guardar la prenda. Por favor, sube un video o proporciona una URL de video.');
    }

    const dataToPersist = {
        ...garmentData,
        videoUrl: finalVideoUrl,
    };

    console.log('[saveGarment] Guardando producto:', {
        id: garmentData.id,
        title: garmentData.title,
        hasVideoUrl: !!dataToPersist.videoUrl,
        videoUrl: dataToPersist.videoUrl.substring(0, 100) + '...' // Mostrar solo los primeros 100 caracteres
    });

    return saveGarmentData(dataToPersist);
}

export async function saveBulkGarments(garmentsToSave: Omit<Garment, 'id' | 'slug' | 'created_at'>[]): Promise<Garment[]> {
    if (garmentsToSave.length === 0) {
        return [];
    }
    // No hay endpoint batch, guardar uno por uno
    const results: Garment[] = [];
    for (const garment of garmentsToSave) {
        try {
            const saved = await saveGarmentData(garment);
            results.push(saved);
        } catch (e) {
            console.error('Error saving garment in bulk:', e);
        }
    }
    return results;
}

export async function deleteGarment(garment: Garment): Promise<void> {
    if (garment.videoUrl) {
        await deleteVideoFile(garment.videoUrl);
    }
    try {
        const res = await fetch('/api/products', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: garment.id }),
        });
        if (!res.ok) throw new Error('Error al eliminar prenda');
    } catch (error) {
        console.error('Error deleting garment:', error);
        throw new Error(`Error al eliminar la prenda de la base de datos: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
}

export async function deleteGarments(garments: Garment[]): Promise<void> {
    if (garments.length === 0) return;
    // Eliminar videos primero
    for (const garment of garments) {
        if (garment.videoUrl) {
            try {
                await deleteVideoFile(garment.videoUrl);
            } catch (error) {
                console.error(`Failed to remove video for garment ${garment.id}, continuing...`, error);
            }
        }
    }
    // Eliminar productos uno por uno
    for (const garment of garments) {
        try {
            await deleteGarment(garment);
        } catch (error) {
            console.error(`Error deleting garment ${garment.id}:`, error);
        }
    }
}

// Helper para requests de otros servicios (no inventario)
async function makeApiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = localStorage.getItem('authToken');
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` }),
            ...options.headers,
        },
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({
            message: response.statusText,
            error: response.status === 404 ? 'Ruta no encontrada' : response.statusText
        }));
        const error = new Error(errorData.message || errorData.error || `Error HTTP: ${response.status}`);
        (error as any).status = response.status;
        throw error;
    }

    const jsonResponse = await response.json();
    return jsonResponse.data || jsonResponse;
}

// Article Functions
// Nota: El endpoint de artículos no está disponible en el backend actual
// Retornamos un array vacío para que la app funcione sin errores
// Cuando implementes el endpoint de artículos, descomenta el código de abajo
export async function getArticles(): Promise<Article[]> {
    // Por ahora, retornar array vacío ya que el endpoint no existe
    // TODO: Implementar cuando el backend tenga el endpoint /api/articles
    return [];

    /* Código para cuando el endpoint esté disponible:
    try {
        const data = await makeApiRequest<Article[]>('/api/articles', {
            method: 'GET',
        });
        return Array.isArray(data) ? data : [];
    } catch (error) {
        console.warn('Error fetching articles:', error);
        return [];
    }
    */
}

export async function saveArticle(articleData: Omit<Article, 'id' | 'slug' | 'created_at'>): Promise<Article> {
    try {
        const data = await makeApiRequest<Article>('/api/articles', {
            method: 'POST',
            body: JSON.stringify(articleData),
        });

        if (!data) {
            throw new Error("No se devolvieron datos del artículo después de guardar.");
        }

        // Actualizar slug si es necesario
        const newSlug = slugify(data.title, data.id);
        if (data.slug !== newSlug) {
            try {
                const updatedData = await makeApiRequest<Article>(`/api/articles/${data.id}`, {
                    method: 'PATCH',
                    body: JSON.stringify({ slug: newSlug }),
                });
                return updatedData || data;
            } catch (updateError) {
                console.warn("Failed to update article slug, but continuing...", updateError);
                return data;
            }
        }

        return data;
    } catch (error) {
        console.error('Error saving article:', error);
        throw new Error(`Error al guardar el artículo: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
}