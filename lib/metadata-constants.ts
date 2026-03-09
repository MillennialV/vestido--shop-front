export const SITE_CONFIG = {
  name: "Vestido.shop by Womanity",
  brandName: "Womanity Boutique",
  baseUrl: "https://www.vestido.shop",
  defaultTitle: "Vestidos de Fiesta Online | Catálogo 2026 con Envíos a todo el Perú",
  defaultDescription: "La tienda online de vestidos más grande. Explora nuestra colección de vestidos de fiesta, noche y graduación. Envíos rápidos y seguros a Arequipa, Trujillo, Cusco y provincias.",
  homeH1: "Vestidos de Fiesta y Noche para Todo el Perú",
  keywords: "vestidos de fiesta lima, showroom san isidro, vestidos elegantes perú, vestidos importados, womanity boutique, vestidos de noche, vestidos de gala, vestidos de boda lima",
  ogImage: "https://storage.googleapis.com/aistudio-hosting/VENICE-og-image.jpg",
  logoUrl: "https://storage.googleapis.com/aistudio-hosting/VENICE-logo.png",
  locale: "es_PE",
  twitterCreator: "@WomanityBoutique",
};

export const PUBLIC_URL = SITE_CONFIG.baseUrl;

export const CONTACT_INFO = {
  phone: "+51956382746",
  whatsapp: "956-382-746",
  address: {
    street: "Av. Paz Soldán 255 Sótano A24",
    locality: "San Isidro",
    region: "Lima",
    postalCode: "15073",
    country: "PE",
    countryName: "Perú",
    latitude: -12.0954,
    longitude: -77.0347,
  },
  openingHours: {
    days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
    opens: "11:00",
    closes: "20:00",
  },
  socialLinks: {
    facebook: "https://www.facebook.com/WomanityBoutique",
    instagram: "https://www.instagram.com/WomanityBoutique",
    tiktok: "https://www.tiktok.com/@WomanityBoutique",
  }
};

export const DEFAULT_FAQs = [
  {
    pregunta: "¿Cómo puedo saber cuál es mi talla correcta?",
    respuesta: "Recomendamos revisar nuestra guía de tallas detallada, disponible en la descripción de cada producto. Si tienes dudas, nuestro equipo de estilistas está disponible por WhatsApp para ofrecerte una asesoría personalizada y asegurar que encuentres el ajuste perfecto."
  },
  {
    pregunta: "¿Cuál es la política de envíos y devoluciones?",
    respuesta: "Ofrecemos envío express a todo el país, con un tiempo de entrega de 24-48 horas en ciudades principales. Aceptamos devoluciones dentro de los primeros 7 días después de la recepción, siempre que la prenda esté en su estado original y con todas las etiquetas."
  },
  {
    pregunta: "Los vestidos, ¿requieren algún cuidado especial?",
    respuesta: "Sí, al ser prendas de alta costura, recomendamos encarecidamente la limpieza en seco profesional. Evita lavar a máquina o usar secadoras. Para el almacenamiento, guárdalo en una funda para prendas en un lugar fresco y seco para preservar la calidad de los tejidos y detalles."
  },
  {
    pregunta: "¿Ofrecen arreglos o ajustes a medida?",
    respuesta: "Actualmente no ofrecemos un servicio de arreglos a medida, pero nuestros vestidos están diseñados para permitir ajustes menores por parte de un sastre profesional. Podemos recomendarte talleres de confianza si lo necesitas."
  }
];
