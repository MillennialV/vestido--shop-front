import { useState, useCallback } from 'react';
import { inventarioService } from '../services/inventarioService';
import type { Garment } from '../types';

export const useProducts = () => {
  const [products, setProducts] = useState<Garment[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10, // Default limit
    total: 0,
    totalPages: 0
  });
  const [selectedProduct, setSelectedProduct] = useState<Garment | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- READ (Listar) ---
  const fetchProducts = useCallback(async (params: { page?: number; limit?: number } = {}) => {
    setIsLoading(true);
    setError(null);
    try {
      const { products: fetchedProducts, pagination: fetchedPagination } = await inventarioService.obtenerListadoProductos({
        limit: params.limit || 10,
        page: params.page || 1,
        sort: 'created_at',
        order: 'desc'
      });
      
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

  // --- READ (Detalle) ---
  const fetchProductById = useCallback(async (id: number | string): Promise<Garment | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const product = await inventarioService.obtenerDetalleProducto(id);
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

  // --- CREATE (Crear) ---
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

      const newProduct = await inventarioService.crearProductoMultipart(formData);
      
      // Actualizar lista localmente
      setProducts((prev: Garment[]) => [newProduct, ...prev]);
      
      return newProduct;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al crear producto';
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // --- UPDATE (Actualizar) ---
  const updateProduct = async (
    id: number | string,
    productData: Partial<Garment>
  ): Promise<Garment> => {
    setIsLoading(true);
    setError(null);
    try {
      const updatedProduct = await inventarioService.actualizarProducto(id, productData);
      
      // Actualizar lista localmente
      setProducts((prev: Garment[]) => prev.map(p => (p.id === updatedProduct.id ? updatedProduct : p)));
      
      // Actualizar producto seleccionado si es el mismo
      if (selectedProduct && selectedProduct.id === updatedProduct.id) {
        setSelectedProduct(updatedProduct);
      }
      
      return updatedProduct;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al actualizar producto';
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // --- DELETE (Eliminar) ---
  const deleteProduct = async (id: number | string): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      await inventarioService.eliminarProducto(id);
      
      // Actualizar lista localmente
      setProducts((prev: Garment[]) => prev.filter(p => p.id !== id && String(p.id) !== String(id)));

      // Limpiar producto seleccionado si es el que se eliminó
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

  // --- FILTER (Filtrar) ---
  const filterProducts = async (filters: Record<string, any>): Promise<Garment[]> => {
    setIsLoading(true);
    setError(null);
    try {
      const filteredProducts = await inventarioService.filtrarBusqueda(filters);
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
