// Utilidad para mapear FaqItem al formato del componente
import type { FaqItem } from '@/types/FaqItem';
export function mapFaqItemToComponent(faqItem: FaqItem): { id: string; pregunta: string; respuesta: string } {
  return {
    id: faqItem.id.toString(),
    pregunta: faqItem.pregunta,
    respuesta: faqItem.respuesta,
  };
}
