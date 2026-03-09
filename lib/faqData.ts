// Utilidad para mapear FaqItem al formato del componente
import type { FaqItem } from '@/types/FaqItem';
import { DEFAULT_FAQs } from './metadata-constants';

export function mapFaqItemToComponent(faqItem: FaqItem): { id: string; pregunta: string; respuesta: string } {
  return {
    id: faqItem.id.toString(),
    pregunta: faqItem.pregunta,
    respuesta: faqItem.respuesta,
  };
}

export const faqData = DEFAULT_FAQs.map((faq, index) => ({
  id: `faq${index + 1}`,
  ...faq
}));
