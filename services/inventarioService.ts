import { Product, ProductsResponse } from '@/types/product';
import type { Garment } from '@/types/Garment';
import { apiResponse } from './apiResponse';
import { INVENTARIO_API_URL } from '@/core/apiConfig';
import { Pagination } from '@/types/pagination';
import { ApiParams } from '@/types/apiParams';

function mapProductToGarment(product: Product): Garment {
  return {
    id: typeof product.id === 'string' ? parseInt(product.id, 10) : product.id,
    brand: product.brand || '',
    title: product.title || '',
    size: product.size || '',
    color: product.color || '',
    videoUrl: product.videoUrl || '',
    description: product.description || '',
    created_at: product.created_at || new Date().toISOString(),
    price: Number(product.price) ?? undefined,
    slug: product.slug || undefined,
    material: product.material || undefined,
    occasion: product.occasion || undefined,
    style_notes: product.style_notes || undefined,
  };
}

class InventarioService {

  async obtenerListadoProductos(params: ApiParams = {}): Promise<{ products: Garment[]; pagination: Pagination }> {
    const { page = 1, limit = 100, sort = 'title', order = 'desc' } = params;
    const queryParams = new URLSearchParams({
      page: String(page),
      limit: String(limit),
      sort,
      order,
    });
    const url = `${INVENTARIO_API_URL}/api/producto/obtener-listado-productos?${queryParams}`;
    const res = await apiResponse<ProductsResponse>(url, { method: "GET" });
    if (!res.success) throw new Error(res.error || 'Error al obtener listado de productos');
    return {
      products: (res?.data.products || []).map(mapProductToGarment),
      pagination: res?.data.pagination || { page, limit, total: 0, totalPages: 0 }
    };
  }

  async obtenerDetalleProducto(id: number | string): Promise<Garment> {
    const url = `${INVENTARIO_API_URL}/api/producto/detalle-producto/${id}`;
    const res = await apiResponse<Product>(url, { method: 'GET' });
    if (!res.success) throw new Error(res.error || 'Error al obtener detalle del producto');
    if (!res.data) throw new Error('Producto no encontrado');
    return mapProductToGarment(res.data);
  }

  async filtrarBusqueda(filtros: Record<string, any>): Promise<Garment[]> {
    const queryParams = new URLSearchParams();
    Object.entries(filtros).forEach(([key, value]) => {
      if (value != null && value !== '') queryParams.append(key, String(value));
    });
    const url = `${INVENTARIO_API_URL}/api/producto/filtrar-busqueda?${queryParams}`;
    const res = await apiResponse<ProductsResponse>(url, { method: 'GET' });
    return (res?.data.products || []).map(mapProductToGarment);
  }

  async crearProducto(productoData: Omit<Garment, 'id' | 'slug' | 'created_at'>): Promise<Garment> {
    const url = `${INVENTARIO_API_URL}/api/producto/crear-producto`;
    const response = await apiResponse<Product>(url, {
      method: 'POST',
      body: JSON.stringify(productoData),
    });
    if (!response.success) throw new Error(response.error || 'Error al crear el producto');
    return mapProductToGarment(response.data);
  }

  async crearProductoMultipart(formData: FormData): Promise<Garment> {
    const url = `${INVENTARIO_API_URL}/api/producto/crear-producto`;
    const response = await apiResponse<Product>(url, {
      method: 'POST',
      body: formData,
    });
    if (!response.success) throw new Error(response.error || 'Error al crear el producto');
    return mapProductToGarment(response.data);
  }

  async actualizarProducto(id: number | string, data: Partial<Garment>): Promise<Garment> {
    const url = `${INVENTARIO_API_URL}/api/producto/actualizar-producto/${id}`;
    const response = await apiResponse<Product>(url, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    if (!response.success) throw new Error(response.error || 'Error al actualizar el producto');
    return mapProductToGarment(response.data);
  }

  async eliminarProducto(id: number | string): Promise<void> {
    const url = `${INVENTARIO_API_URL}/api/producto/eliminar-producto/${id}`
    await apiResponse(url, { method: 'DELETE' });
  }

  async crearProductosEnLote(lista: Omit<Garment, 'id' | 'slug' | 'created_at'>[]): Promise<Garment[]> {
    const creados: Garment[] = [];
    const errores: string[] = [];

    for (const item of lista) {
      try {
        creados.push(await this.crearProducto(item));
      } catch (e: any) {
        errores.push(`Error en ${item.title}: ${e.message}`);
      }
    }

    if (errores.length) console.warn('[Batch Create] Errores parciales:', errores);
    return creados;
  }

  async eliminarProductosEnLote(ids: (number | string)[]): Promise<void> {
    for (const id of ids) {
      try {
        await this.eliminarProducto(id);
      } catch (e) {
        console.error(`[Batch Delete] Error eliminando ${id}`, e);
      }
    }
  }
}

export const inventarioService = new InventarioService();
export default inventarioService;