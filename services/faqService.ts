/**
 * Microservicio para manejar operaciones de preguntas frecuentes (FAQ)
 * 
 * Este servicio se encarga de:
 * - Consultar el microservicio de preguntas frecuentes
 * - Crear nuevas preguntas frecuentes
 * - Actualizar preguntas existentes
 * - Eliminar preguntas frecuentes
 * - Filtrar preguntas por estado "activa"
 * - Ordenar preguntas por el campo "orden" (ascendente o descendente)
 * - Mapear los datos del backend al formato esperado por los componentes
 */

import type { FaqItem } from '@/interfaces/FaqItem';

const PREGUNTAS_API_URL = import.meta.env.VITE_API_PREGUNTAS_BASE_URL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:3005';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

interface PreguntasResponse {
  preguntas?: FaqItem[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  [key: string]: any;
}

export interface GetPreguntasParams {
  limit?: number;
  estado?: string;
  order?: 'asc' | 'desc';
}

export interface CreatePreguntaData {
  pregunta: string;
  respuesta: string;
  orden?: number;
  estado?: string;
}

export interface UpdatePreguntaData {
  pregunta?: string;
  respuesta?: string;
  orden?: number;
  estado?: string;
}

/**
 * Mapea la respuesta cruda de la API al tipo FaqItem
 */
function mapPreguntaToFaqItem(pregunta: any): FaqItem {
  return {
    id: pregunta.id?.toString() || String(pregunta.id || Math.random()),
    pregunta: pregunta.pregunta || pregunta.question || '',
    respuesta: pregunta.respuesta || pregunta.answer || '',
    orden: pregunta.orden || pregunta.order || 0,
    estado: pregunta.estado || pregunta.status || 'activo',
    created_by: pregunta.created_by || '',
    created_at: pregunta.created_at || new Date().toISOString(),
    updated_at: pregunta.updated_at || new Date().toISOString(),
  };
}

/**
 * Mapea FaqItem del backend a formato que espera el componente (question/answer)
 */
export function mapFaqItemToComponent(faqItem: FaqItem): { id: string; question: string; answer: string } {
  return {
    id: faqItem.id.toString(),
    question: faqItem.pregunta,
    answer: faqItem.respuesta,
  };
}

/**
 * Clase de error personalizada para errores HTTP del servicio de preguntas
 */
export class PreguntasServiceError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public originalError?: any
  ) {
    super(message);
    this.name = 'PreguntasServiceError';
  }
}

/**
 * Realiza peticiones HTTP al microservicio de preguntas
 * Maneja la autenticación y el formato de respuesta de la API
 * Lanza errores específicos según el código HTTP
 */
async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${PREGUNTAS_API_URL}${endpoint}`;
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
      let errorData: any = {};
      try {
        errorData = await response.json();
      } catch {
        errorData = { message: response.statusText };
      }

      const errorMessage = errorData.message || errorData.error || `Error HTTP: ${response.status}`;

      switch (response.status) {
        case 401:
          throw new PreguntasServiceError(
            'No autorizado. Token inválido o faltante.',
            401,
            errorData
          );
        case 404:
          throw new PreguntasServiceError(
            errorMessage || 'Recurso no encontrado',
            404,
            errorData
          );
        case 422:
          throw new PreguntasServiceError(
            errorMessage || 'Error de validación',
            422,
            errorData
          );
        case 500:
          throw new PreguntasServiceError(
            errorMessage || 'Error del servidor',
            500,
            errorData
          );
        default:
          throw new PreguntasServiceError(
            errorMessage,
            response.status,
            errorData
          );
      }
    }

    if (response.status === 204) {
      return {} as T;
    }

    const jsonResponse: ApiResponse<T> = await response.json();

    if (jsonResponse.success === false) {
      throw new PreguntasServiceError(
        jsonResponse.message || jsonResponse.error || 'Error en la respuesta del servidor',
        response.status,
        jsonResponse
      );
    }

    return (jsonResponse.data !== undefined ? jsonResponse.data : jsonResponse) as T;
  } catch (error) {
    if (error instanceof PreguntasServiceError) {
      throw error;
    }

    //console.error(`[PreguntasAPI] Error en ${endpoint}:`, error);
    throw new PreguntasServiceError(
      error instanceof Error ? error.message : 'Error desconocido',
      0,
      error
    );
  }
}

/**
 * Clase principal del servicio de preguntas frecuentes
 * 
 * Proporciona métodos para interactuar con el microservicio de preguntas:
 * - obtenerPreguntas: Obtiene el listado de preguntas frecuentes con filtrado y ordenamiento
 * - crearPregunta: Crea una nueva pregunta frecuente
 * - actualizarPregunta: Actualiza una pregunta existente
 * - eliminarPregunta: Elimina una pregunta por su ID
 */
class PreguntasService {
  /**
   * Obtiene listado de preguntas frecuentes desde el microservicio
   * 
   * @param params - Parámetros opcionales para filtrar y limitar los resultados
   * @param params.limit - Número máximo de preguntas a retornar (por defecto: sin límite)
   * @param params.estado - Estado de las preguntas a filtrar (por defecto: 'activa')
   * @param params.order - Orden de clasificación: 'asc' (ascendente) o 'desc' (descendente). Por defecto 'asc'
   * @returns Promise con array de FaqItem filtradas y ordenadas según los parámetros
   * 
   * La API retorna: { success: true, data: { preguntas: [...], pagination: {...} } }
   * Este método construye la URL con query parameters y procesa la respuesta del servidor
   */
  async obtenerPreguntas(params: GetPreguntasParams = {}): Promise<FaqItem[]> {
    try {
      const { limit = undefined, estado = 'activa', order = 'asc' } = params;

      const queryParams = new URLSearchParams();
      if (limit !== undefined) {
        queryParams.append('limit', String(limit));
      }
      if (estado) {
        queryParams.append('estado', estado);
      }

      const endpoint = queryParams.toString()
        ? `/api/preguntas?${queryParams.toString()}`
        : '/api/preguntas';

      const data = await apiRequest<PreguntasResponse>(endpoint, {
        method: 'GET',
      });

      let preguntas: any[] = [];

      if (data.preguntas && Array.isArray(data.preguntas)) {
        preguntas = data.preguntas;
      } else if (Array.isArray(data)) {
        preguntas = data;
      } else {
        //console.warn('[PreguntasAPI] Formato de respuesta inesperado:', data);
        return [];
      }

      const faqItems = preguntas
        .map(mapPreguntaToFaqItem)
        .filter(item => item.estado === 'activa')
        .sort((a, b) => {
          if (order === 'desc') {
            return b.orden - a.orden;
          }
          return a.orden - b.orden;
        });

      return faqItems;
    } catch (error) {
      //console.error('[PreguntasService] Error al obtener preguntas:', error);
      throw error;
    }
  }

  /**
   * Crea una nueva pregunta frecuente
   * 
   * @param data - Datos de la pregunta a crear
   * @param data.pregunta - Texto de la pregunta (requerido)
   * @param data.respuesta - Texto de la respuesta (requerido)
   * @param data.orden - Orden de visualización (opcional)
   * @param data.estado - Estado de la pregunta: 'activa' | 'inactiva' (opcional, por defecto 'activa')
   * @returns Promise con la pregunta creada (FaqItem)
   * 
   * Requiere autenticación JWT en el header Authorization
   * Errores posibles:
   * - 401: No autorizado (token inválido o faltante)
   * - 422: Error de validación
   * - 500: Error del servidor
   */
  async crearPregunta(data: CreatePreguntaData): Promise<FaqItem> {
    try {
      const payload = {
        pregunta: data.pregunta,
        respuesta: data.respuesta,
        ...(data.orden !== undefined && { orden: data.orden }),
        ...(data.estado !== undefined && { estado: data.estado }),
      };

      const response = await apiRequest<any>('/api/preguntas', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      let pregunta: any;
      if (response.pregunta) {
        pregunta = response.pregunta;
      } else if (response.data) {
        pregunta = response.data;
      } else {
        pregunta = response;
      }

      return mapPreguntaToFaqItem(pregunta);
    } catch (error) {
      //console.error('[PreguntasService] Error al crear pregunta:', error);
      throw error;
    }
  }

  /**
   * Actualiza una pregunta frecuente existente
   * 
   * @param id - ID de la pregunta a actualizar (UUID)
   * @param data - Datos a actualizar (todos los campos son opcionales)
   * @param data.pregunta - Nuevo texto de la pregunta (opcional)
   * @param data.respuesta - Nuevo texto de la respuesta (opcional)
   * @param data.orden - Nuevo orden de visualización (opcional)
   * @param data.estado - Nuevo estado: 'activa' | 'inactiva' (opcional)
   * @returns Promise con la pregunta actualizada (FaqItem)
   * 
   * Requiere autenticación JWT en el header Authorization
   * Errores posibles:
   * - 401: No autorizado (token inválido o faltante)
   * - 404: Pregunta no encontrada
   * - 422: Error de validación
   * - 500: Error del servidor
   */
  async actualizarPregunta(id: string, data: UpdatePreguntaData): Promise<FaqItem> {
    try {
      const payload: any = {};
      if (data.pregunta !== undefined) payload.pregunta = data.pregunta;
      if (data.respuesta !== undefined) payload.respuesta = data.respuesta;
      if (data.orden !== undefined) payload.orden = data.orden;
      if (data.estado !== undefined) payload.estado = data.estado;

      const response = await apiRequest<any>(`/api/preguntas/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });

      let pregunta: any;
      if (response.pregunta) {
        pregunta = response.pregunta;
      } else if (response.data) {
        pregunta = response.data;
      } else {
        pregunta = response;
      }

      return mapPreguntaToFaqItem(pregunta);
    } catch (error) {
      //console.error('[PreguntasService] Error al actualizar pregunta:', error);
      throw error;
    }
  }

  /**
   * Elimina una pregunta frecuente por su ID
   * 
   * @param id - ID de la pregunta a eliminar (UUID)
   * @returns Promise con información de la pregunta eliminada
   * 
   * La API retorna: { success: true, message: "...", data: { id, pregunta } }
   * 
   * Requiere autenticación JWT en el header Authorization
   * Errores posibles:
   * - 401: No autorizado (token inválido o faltante)
   * - 404: Pregunta no encontrada
   * - 500: Error del servidor
   */
  async eliminarPregunta(id: string): Promise<{ id: string; pregunta: string }> {
    try {
      const response = await apiRequest<any>(`/api/preguntas/${id}`, {
        method: 'DELETE',
      });

      if (response.data) {
        return {
          id: response.data.id || id,
          pregunta: response.data.pregunta || '',
        };
      }

      return {
        id: response.id || id,
        pregunta: response.pregunta || '',
      };
    } catch (error) {
      //console.error('[PreguntasService] Error al eliminar pregunta:', error);
      throw error;
    }
  }
}

export const preguntasService = new PreguntasService();
export default preguntasService;
