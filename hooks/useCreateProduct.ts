import { useState } from 'react';
import type { Garment } from '@/types/Garment';

interface CreateProductData {
  title: string;
  brand: string;
  size: string;
  color: string;
  description: string;
  price?: number;
  material?: string;
  occasion?: string;
  style_notes?: string;
  videoUrl?: string;
}

export const useCreateProduct = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createProduct = async (
    productData: CreateProductData,
    videoFile: File | null
  ): Promise<Garment | null> => {
    setIsLoading(true);
    console.log('[useCreateProduct] Iniciando creación de producto:', {
      title: productData.title,
      brand: productData.brand,
      hasVideo: !!videoFile,
      hasVideoUrl: !!productData.videoUrl,
    });
    setError(null);

    try {
      const formData = new FormData();

      // Agregar datos del producto
      formData.append('title', productData.title);
      formData.append('brand', productData.brand);
      formData.append('size', productData.size);
      formData.append('color', productData.color);
      formData.append('description', productData.description);

      if (productData.price !== undefined) {
        formData.append('price', String(productData.price));
      }
      if (productData.material) {
        formData.append('material', productData.material);
      }
      if (productData.occasion) {
        formData.append('occasion', productData.occasion);
      }
      if (productData.style_notes) {
        formData.append('style_notes', productData.style_notes);
      }
      if (productData.videoUrl) {
        formData.append('videoUrl', productData.videoUrl);
      }

      // Agregar video si existe
      if (videoFile) {
        formData.append('video', videoFile);
        console.log('[useCreateProduct] Video agregado:', {
          name: videoFile.name,
          size: videoFile.size,
          type: videoFile.type,
        });
      }

      // Log del FormData completo
      console.log('[useCreateProduct] FormData a enviar:');
      formData.forEach((value, key) => {
        if (value instanceof File) {
          console.log(`  ${key}: File(${(value as File).name}, ${(value as File).size} bytes)`);
        } else {
          console.log(`  ${key}: ${value}`);
        }
      });

      // Obtener token
      const token = localStorage.getItem('authToken');
      const headers: HeadersInit = token ? { 'Authorization': `Bearer ${token}` } : {};

      // Hacer llamada al API
      const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3005';
      console.log('[useCreateProduct] Enviando POST a:', `${apiUrl}/api/producto/crear-producto`);

      const response = await fetch(`${apiUrl}/api/producto/crear-producto`, {
        method: 'POST',
        headers,
        body: formData,
      });

      console.log('[useCreateProduct] Respuesta del servidor:', {
        status: response.status,
        statusText: response.statusText,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(errorData.message || errorData.error || `Error HTTP: ${response.status}`);
      }

      const responseData = await response.json();

      console.log('[useCreateProduct] Datos de respuesta:', responseData);

      if (!responseData.success) {
        throw new Error(responseData.message || responseData.error || 'Error en la respuesta del servidor');
      }

      const product = responseData.data?.product || responseData.data;
      if (!product) {
        throw new Error('No se devolvieron datos del producto');
      }

      console.log('[useCreateProduct] Producto creado exitosamente:', {
        id: product.id,
        title: product.title,
        hasVideo: !!product.videoUrl,
      });

      return product as Garment;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      console.error('[useCreateProduct] Error al crear producto:', {
        message: errorMessage,
        error: err,
      });
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    createProduct,
    isLoading,
    error,
  };
};
