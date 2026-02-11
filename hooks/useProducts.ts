import { useState, useCallback, useEffect } from 'react';

import type { Garment } from '@/types/Garment';

export const useProducts = () => {
  const [products, setProducts] = useState<Garment[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });
  const [selectedProduct, setSelectedProduct] = useState<Garment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async (params: { page?: number; limit?: number } = {}) => {
    setIsLoading(true);
    setError(null);
    try {
      const page = params.page || 1;
      const limit = params.limit || 10;
      const res = await fetch(`/api/products?page=${page}&limit=${limit}&sort=created_at&order=desc`);
      if (!res.ok) throw new Error('Error al cargar productos');
      const data = await res.json();
      const fetchedProducts = Array.isArray(data) ? data : data.products || [];
      const fetchedPagination = data.pagination || { page, limit, total: fetchedProducts.length, totalPages: 1 };
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
    videoFile: File | null
  ): Promise<Garment> => {
    setIsLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      Object.entries(productData).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(key, String(value));
        }
      });
      if (videoFile) {
        formData.append('video', videoFile);
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
    videoFile: File | null = null
  ): Promise<Garment> => {
    setIsLoading(true);
    setError(null);
    try {
      let res: Response;

      if (videoFile) {
        const formData = new FormData();
        formData.append('id', String(id));
        Object.entries(productData).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            formData.append(key, String(value));
          }
        });
        formData.append('video', videoFile);

        res = await fetch('/api/products', {
          method: 'PUT',
          body: formData,
        });
      } else {
        res = await fetch(`/api/products`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, ...productData }),
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
      setProducts(filteredProducts);
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
