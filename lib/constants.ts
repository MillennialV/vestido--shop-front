/**
 * Constantes globales para SEO y metadatos por defecto.
 * Se utilizan como fallback cuando la API no retorna información de la tienda o durante la carga.
 */

export const ABREPE_HOST = "abrepe.com";
export const ABREPE_DISPLAY_NAME = "Abrepe";

export const PUBLIC_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.vestido.shop';
export const DEFAULT_OG_IMAGE = "https://storage.googleapis.com/aistudio-hosting/VENICE-og-image.jpg";

export const DEFAULT_SEO = {
    title: "Abrepe | Tu estilo, tu tienda",
    siteName: "Abrepe",
    description: "Encuentra productos exclusivos e inspiración en nuestra tienda online impulsada por Abrepe.",
    keywords: "abrepe, moda, ecommerce, tienda online, vestidos, perú",
    canonical: PUBLIC_URL,
    robots: "index, follow",
    locale: "es_PE",
    ogImage: DEFAULT_OG_IMAGE
};

export const DEFAULT_STORE_INFO = {
    title: "Mi tienda en Abrepe",
    description: "Tienda online con la mejor selección de productos.",
    address: "",
    phone: "",
    whatsapp: "",
    email: ""
};

export const BLOG_CONSTANTS = {
    indexTitle: "Blog | Inspiración y Estilo - Abrepe",
    indexDescription: "Descubre las últimas tendencias, consejos de moda y las historias detrás de nuestros productos en el blog de Abrepe.",
    postNotFoundTitle: "Post no encontrado | Abrepe",
    postNotFoundDescription: "Lo sentimos, el artículo que buscas no está disponible en este momento."
};

export const STATIC_PAGE_DEFAULTS = {
    envios: {
        title: 'Envíos y Devoluciones | Abrepe',
        description: 'Información detallada sobre plazos de entrega, costos de envío y nuestra política de cambios.'
    },
    privacidad: {
        title: 'Política de Privacidad | Abrepe',
        description: 'Conoce cómo protegemos tus datos personales y garantizamos tu privacidad en Abrepe.'
    },
    terminos: {
        title: 'Términos y Condiciones | Abrepe',
        description: 'Términos legales y condiciones generales de uso de nuestra plataforma y servicios.'
    }
};

export const SOCIAL_DEFAULTS = {
    twitter: "",
    instagram: "",
    facebook: "",
    twitterCreator: ""
};

export const SCHEMA_DEFAULTS = {
    logo: "https://storage.googleapis.com/aistudio-hosting/VENICE-logo.png",
    priceRange: "$$",
    openingHours: "Mo-Sa 11:00-20:00"
};
