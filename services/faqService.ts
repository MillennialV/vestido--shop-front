/**
 * Microservicio para manejar operaciones de preguntas frecuentes (FAQ)
 * 
 * Este servicio se encarga de:
 * - Consultar el microservicio de preguntas frecuentes
 * - Filtrar preguntas por estado "activa"
 * - Ordenar preguntas por el campo "orden" (ascendente o descendente)
 * - Mapear los datos del backend al formato esperado por los componentes
 */

import type { FaqItem } from '../types';

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
 * Realiza peticiones HTTP al microservicio de preguntas
 * Maneja la autenticación y el formato de respuesta de la API
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
      const errorData = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(errorData.message || errorData.error || `Error HTTP: ${response.status}`);
    }

    const jsonResponse: ApiResponse<T> = await response.json();
    
    if (jsonResponse.success === false) {
      throw new Error(jsonResponse.message || jsonResponse.error || 'Error en la respuesta del servidor');
    }

    return (jsonResponse.data !== undefined ? jsonResponse.data : jsonResponse) as T;
  } catch (error) {
    console.error(`[PreguntasAPI] Error en ${endpoint}:`, error);
    throw error;
  }
}

/**
 * Clase principal del servicio de preguntas frecuentes
 * 
 * Proporciona métodos para interactuar con el microservicio de preguntas:
 * - obtenerPreguntas: Obtiene el listado de preguntas frecuentes con filtrado y ordenamiento
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
        console.warn('[PreguntasAPI] Formato de respuesta inesperado:', data);
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
      console.error('[PreguntasService] Error al obtener preguntas:', error);
      throw error;
    }
  }
}

export const preguntasService = new PreguntasService();
export default preguntasService;
