// Utilidad para mapear FaqItem al formato del componente
import type { FaqItem } from '@/types/FaqItem';
export function mapFaqItemToComponent(faqItem: FaqItem): { id: string; pregunta: string; respuesta: string } {
  return {
    id: faqItem.id.toString(),
    pregunta: faqItem.pregunta,
    respuesta: faqItem.respuesta,
  };
}
export const faqData = [
  {
    id: 'faq1',
    pregunta: '¿Cómo puedo saber cuál es mi talla correcta?',
    respuesta: 'Recomendamos revisar nuestra guía de tallas detallada, disponible en la descripción de cada producto. Si tienes dudas, nuestro equipo de estilistas está disponible por WhatsApp para ofrecerte una asesoría personalizada y asegurar que encuentres el ajuste perfecto.'
  },
  {
    id: 'faq2',
    pregunta: '¿Cuál es la política de envíos y devoluciones?',
    respuesta: 'Ofrecemos envío express a todo el país, con un tiempo de entrega de 24-48 horas en ciudades principales. Aceptamos devoluciones dentro de los primeros 7 días después de la recepción, siempre que la prenda esté en su estado original y con todas las etiquetas.'
  },
  {
    id: 'faq3',
    pregunta: 'Los vestidos, ¿requieren algún cuidado especial?',
    respuesta: 'Sí, al ser prendas de alta costura, recomendamos encarecidamente la limpieza en seco profesional. Evita lavar a máquina o usar secadoras. Para el almacenamiento, guárdalo en una funda para prendas en un lugar fresco y seco para preservar la calidad de los tejidos y detalles.'
  },
  {
    id: 'faq4',
    pregunta: '¿Ofrecen arreglos o ajustes a medida?',
    respuesta: 'Actualmente no ofrecemos un servicio de arreglos a medida, pero nuestros vestidos están diseñados para permitir ajustes menores por parte de un sastre profesional. Podemos recomendarte talleres de confianza si lo necesitas.'
  }
];
