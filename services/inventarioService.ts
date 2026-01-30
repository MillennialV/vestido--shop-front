// services/inventarioService.ts
// Microservicio para manejar operaciones de inventario/productos

import type { Garment } from '../types';

// URL del microservicio de inventario desde variables de entorno
const INVENTARIO_API_URL = import.meta.env.VITE_API_INVENTARIO_BASE_URL || 'http://localhost:3005';

// ==========================================
// Interfaces & Tipos
// ==========================================

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface ProductsResponse {
  products: any[];
  pagination: PaginationData;
}

interface ProductResponse {
  product?: any;
  [key: string]: any;
}

export interface GetProductsParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

// ==========================================
// Helpers & Utilidades
// ==========================================

/** Mapea la respuesta cruda de la API al tipo Garment */
function mapProductToGarment(product: any): Garment {
  return {
    id: typeof product.id === 'string' ? parseInt(product.id, 10) : product.id,
    brand: product.brand || '',
    title: product.title || '',
    size: product.size || '',
    color: product.color || '',
    videoUrl: product.videoUrl || '',
    description: product.description || '',
    created_at: product.created_at || new Date().toISOString(),
    price: product.price ?? undefined,
    slug: product.slug || undefined,
    material: product.material || undefined,
    occasion: product.occasion || undefined,
    style_notes: product.style_notes || undefined,
  };
}

/** Realiza peticiones HTTP al microservicio de inventario */
async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${INVENTARIO_API_URL}${endpoint}`;
  const token = localStorage.getItem('authToken');
  const isFormData = options.body instanceof FormData;

  const headers: HeadersInit = {
    ...(!isFormData && { 'Content-Type': 'application/json' }),
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...options.headers,
  };

  try {
    const response = await fetch(url, { ...options, headers });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(errorData.message || errorData.error || `Error HTTP: ${response.status}`);
    }

    const jsonResponse: ApiResponse<T> = await response.json();
    if (!jsonResponse.success) {
      throw new Error(jsonResponse.message || jsonResponse.error || 'Error en la respuesta del servidor');
    }

    return jsonResponse.data as T;
  } catch (error) {
    console.error(`[InventarioAPI] Error en ${endpoint}:`, error);
    throw error;
  }
}

class InventarioService {
  // ==========================================
  // Métodos de Lectura (Read)
  // ==========================================

  /** Obtiene listado de productos con paginación */
  async obtenerListadoProductos(params: GetProductsParams = {}): Promise<{ products: Garment[]; pagination: ProductsResponse['pagination'] }> {
    const { page = 1, limit = 100, sort = 'title', order = 'desc' } = params;
    const queryParams = new URLSearchParams({
      page: String(page),
      limit: String(limit),
      sort,
      order,
    });

    const data = await apiRequest<ProductsResponse>(`/api/producto/obtener-listado-productos?${queryParams}`, { method: 'GET' });

    return {
      products: (data?.products || []).map(mapProductToGarment),
      pagination: data?.pagination || { page, limit, total: 0, totalPages: 0 }
    };
  }

  /** Obtiene detalle de un producto por ID */
  async obtenerDetalleProducto(id: number | string): Promise<Garment> {
    const data = await apiRequest<ProductResponse>(`/api/producto/detalle-producto/${id}`, { method: 'GET' });
    const product = data.product || data;
    if (!product) throw new Error('Producto no encontrado');
    return mapProductToGarment(product);
  }

  /** Busca productos con filtros dinámicos */
  async filtrarBusqueda(filtros: Record<string, any>): Promise<Garment[]> {
    const queryParams = new URLSearchParams();
    Object.entries(filtros).forEach(([key, value]) => {
      if (value != null && value !== '') queryParams.append(key, String(value));
    });

    const data = await apiRequest<ProductsResponse>(`/api/producto/filtrar-busqueda?${queryParams}`, { method: 'GET' });
    return (data?.products || []).map(mapProductToGarment);
  }

  // ==========================================
  // Métodos de Escritura (Create/Update/Delete)
  // ==========================================

  /** Crea un nuevo producto (JSON) */
  async crearProducto(productoData: Omit<Garment, 'id' | 'slug' | 'created_at'>): Promise<Garment> {
    const response = await apiRequest<ProductResponse>('/api/producto/crear-producto', {
      method: 'POST',
      body: JSON.stringify(productoData),
    });
    return this._procesarRespuestaProducto(response, 'crear');
  }

  /** Crea un nuevo producto con soporte de archivos (FormData) */
  async crearProductoMultipart(formData: FormData): Promise<Garment> {
    const response = await apiRequest<ProductResponse>('/api/producto/crear-producto', {
      method: 'POST',
      body: formData,
    });
    return this._procesarRespuestaProducto(response, 'crear');
  }

  /** Actualiza un producto existente */
  async actualizarProducto(id: number | string, data: Partial<Garment>): Promise<Garment> {
    const response = await apiRequest<ProductResponse>(`/api/producto/actualizar-producto/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return this._procesarRespuestaProducto(response, 'actualizar');
  }

  /** Elimina un producto por ID */
  async eliminarProducto(id: number | string): Promise<void> {
    await apiRequest(`/api/producto/eliminar-producto/${id}`, { method: 'DELETE' });
  }

  /** Helper privado para procesar respuestas de escritura */
  private _procesarRespuestaProducto(data: ProductResponse, accion: string): Garment {
    const product = data.product || data;
    if (!product) throw new Error(`Error al ${accion} el producto: Respuesta inválida`);
    return mapProductToGarment(product);
  }

  // ==========================================
  // Operaciones en Lote (Batch)
  // ==========================================

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