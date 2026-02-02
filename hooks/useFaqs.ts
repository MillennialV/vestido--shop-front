/**
 * Hook personalizado para gestionar las preguntas frecuentes (FAQ)
 * 
 * Este hook proporciona:
 * - Estado de carga y errores
 * - Función para obtener preguntas desde el microservicio
 * - Mapeo automático de datos del backend al formato del componente
 * - Fallback a datos por defecto si falla la consulta al servicio
 * - Prevención de múltiples consultas innecesarias
 */

import { useState, useCallback } from 'react';
import { preguntasService, mapFaqItemToComponent } from '../services/faqService';
import { faqData } from '../lib/faqData';
import type { FaqItem } from '@/types/FaqItem';

export interface FaqComponentItem {
  id: string;
  pregunta: string;
  respuesta: string;
}

/**
 * Hook para gestionar el estado y las operaciones de preguntas frecuentes
 * 
 * @returns Objeto con:
 * - faqs: Array de FaqItem originales del backend
 * - faqsForComponent: Array mapeado al formato que espera el componente (question/answer)
 * - isLoading: Estado de carga
 * - error: Mensaje de error si existe
 * - fetchFaqs: Función para cargar las preguntas desde el servicio
 */
export const useFaqs = () => {
  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [faqsForComponent, setFaqsForComponent] = useState<FaqComponentItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasFetched, setHasFetched] = useState(false);

  /**
   * Obtiene las preguntas frecuentes desde el microservicio
   * 
   * @param useFallback - Si es true, usa datos por defecto en caso de error (por defecto: true)
   * @param force - Si es true, fuerza una nueva consulta incluso si ya hay datos cargados (por defecto: false)
   * @param params - Parámetros opcionales para la consulta (limit, estado, order)
   * @returns Promise con array de preguntas en formato para el componente
   */
  const fetchFaqs = useCallback(async (
    useFallback: boolean = true,
    force: boolean = false,
    params?: { limit?: number; estado?: string; order?: 'asc' | 'desc' }
  ): Promise<FaqComponentItem[]> => {
    if (hasFetched && !force && faqsForComponent.length > 0) {
      return faqsForComponent;
    }

    setIsLoading(true);
    setError(null);

    try {
      const fetchedFaqs = await preguntasService.obtenerPreguntas(params);

      const componentFaqs = fetchedFaqs.map(mapFaqItemToComponent);

      setFaqs(fetchedFaqs);
      setFaqsForComponent(componentFaqs);
      setHasFetched(true);

      return componentFaqs;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al cargar preguntas frecuentes';
      setError(msg);
      console.error('[useFaqs] Error:', err);

      if (useFallback) {
        console.warn('[useFaqs] Usando datos por defecto debido a error');
        const fallbackFaqs = faqData.map(item => ({
          id: item.id,
          pregunta: item.pregunta,
          respuesta: item.respuesta,
        }));
        setFaqsForComponent(fallbackFaqs);
        setHasFetched(true);
        return fallbackFaqs;
      }

      return [];
    } finally {
      setIsLoading(false);
    }
  }, [hasFetched, faqsForComponent.length]);

  return {
    faqs,
    faqsForComponent,
    isLoading,
    error,
    fetchFaqs,
  };
};
