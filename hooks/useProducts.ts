import { useState, useCallback, useEffect } from 'react';

import type { Garment } from '@/types/Garment';

export const useProducts = (initialData: Garment[] = [], initialPagination: any = null) => {
  const [products, setProducts] = useState<Garment[]>(initialData);
  const [pagination, setPagination] = useState(() => {
    const p = initialPagination?.pagination || initialPagination;
    return {
      page: p?.page || 1,
      limit: p?.limit || 12,
      total: p?.total || initialData.length,
      totalPages: p?.totalPages || p?.pages || Math.ceil((p?.total || initialData.length) / (p?.limit || 12)) || 1
    };
  });
  const [selectedProduct, setSelectedProduct] = useState<Garment | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async (params: { page?: number; limit?: number; brand?: string; size?: string; color?: string; q?: string } = {}) => {
    setIsLoading(true);
    setError(null);
    try {
      const page = params.page || 1;
      const limit = params.limit || 12;

      const queryParams = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        sort: 'created_at',
        order: 'desc'
      });

      if (params.brand && params.brand !== 'all') queryParams.append('brand', params.brand);
      if (params.size && params.size !== 'all') queryParams.append('size', params.size);
      if (params.color && params.color !== 'all') queryParams.append('color', params.color);
      if (params.q) queryParams.append('q', params.q);

      const res = await fetch(`/api/products?${queryParams.toString()}`);
      if (!res.ok) throw new Error('Error al cargar productos');
      const data = await res.json();
      const fetchedProducts = Array.isArray(data) ? data : data.products || [];
      const fetchedPagination = data.pagination || {
        page: data.page || page,
        limit: data.limit || limit,
        total: data.total || fetchedProducts.length,
        totalPages: data.totalPages || data.pages || Math.ceil((data.total || fetchedProducts.length) / limit) || 1
      };
      setProducts(fetchedProducts);
      setPagination(fetchedPagination);
      return fetchedProducts;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al cargar productos';
      setError(msg);
      console.error('[useProducts] Error:', err);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const fetchProductById = useCallback(async (id: number | string): Promise<Garment | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/products/${id}`);
      if (!res.ok) throw new Error('Error al cargar el detalle del producto');
      const product = await res.json();
      setSelectedProduct(product);
      return product;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al cargar el detalle del producto';
      setError(msg);
      console.error('[useProducts] Error al obtener detalle:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createProduct = async (
    productData: Record<string, any>,
    videoFile: File | null,
    imagePrincipalFile: File | null = null,
    additionalImages: File[] = []
  ): Promise<Garment> => {
    setIsLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      Object.entries(productData).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            value.forEach((v) => formData.append(key, String(v)));
          } else {
            formData.append(key, String(value));
          }
        }
      });
      if (videoFile) {
        formData.append('video', videoFile);
      }
      if (imagePrincipalFile) {
        formData.append('image_principal', imagePrincipalFile);
      }
      if (additionalImages && additionalImages.length > 0) {
        additionalImages.forEach((file) => {
          formData.append('images', file);
        });
      }

      const res = await fetch('/api/products', {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw errorData;
      }
      const newProduct = await res.json();
      setProducts((prev: Garment[]) => [newProduct, ...prev]);
      return newProduct;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear producto');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateProduct = async (
    id: number | string,
    productData: Partial<Garment>,
    videoFile: File | null = null,
    imagePrincipalFile: File | null = null,
    additionalImages: File[] = []
  ): Promise<Garment> => {
    setIsLoading(true);
    setError(null);
    try {
      let res: Response;

      if (videoFile || imagePrincipalFile || (additionalImages && additionalImages.length > 0)) {
        const formData = new FormData();
        formData.append('id', String(id));
        Object.entries(productData).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            if (Array.isArray(value)) {
              value.forEach((v) => formData.append(key, String(v)));
            } else {
              formData.append(key, String(value));
            }
          }
        });
        if (videoFile) formData.append('video', videoFile);
        if (imagePrincipalFile) formData.append('image_principal', imagePrincipalFile);
        if (additionalImages && additionalImages.length > 0) {
          additionalImages.forEach((file) => {
            formData.append('images', file);
          });
        }

        res = await fetch('/api/products', {
          method: 'PUT',
          body: formData,
          cache: 'no-store'
        });
      } else {
        res = await fetch(`/api/products`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, ...productData }),
          cache: 'no-store'
        });
      }

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw errorData;
      }
      const updatedProduct = await res.json();
      setProducts((prev: Garment[]) => prev.map(p => (p.id === updatedProduct.id ? updatedProduct : p)));
      if (selectedProduct && selectedProduct.id === updatedProduct.id) {
        setSelectedProduct(updatedProduct);
      }
      return updatedProduct;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar producto');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteProduct = async (id: number | string): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/products`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error('Error al eliminar producto');
      setProducts((prev: Garment[]) => prev.filter(p => p.id !== id && String(p.id) !== String(id)));
      if (selectedProduct && (selectedProduct.id === id || String(selectedProduct.id) === String(id))) {
        setSelectedProduct(null);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al eliminar producto';
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const filterProducts = async (filters: Record<string, any>): Promise<Garment[]> => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value != null && value !== '') params.append(key, String(value));
      });
      const res = await fetch(`/api/products?${params.toString()}`);
      if (!res.ok) throw new Error('Error al filtrar productos');
      const data = await res.json();
      const filteredProducts = Array.isArray(data) ? data : data.products || [];
      const fetchedPagination = data.pagination || { page: 1, limit: filters.limit || 10, total: filteredProducts.length, totalPages: 1 };

      setProducts(filteredProducts);
      setPagination(fetchedPagination);
      return filteredProducts;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al filtrar productos';
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    products,
    pagination,
    selectedProduct,
    isLoading,
    error,
    fetchProducts,
    fetchProductById,
    createProduct,
    updateProduct,
    deleteProduct,
    filterProducts,
    setProducts,
    setSelectedProduct
  };
};
