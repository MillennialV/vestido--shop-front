"use client";

/**
 * Utilidad para el seguimiento de eventos en Google Analytics (GA4)
 */

export const GA_TRACKING_ID = process.env.NEXT_PUBLIC_GA_ID;
// https://developers.google.com/analytics/devguides/collection/gtagjs/pages
export const pageview = (url: string) => {
    if (typeof window !== "undefined" && (window as any).gtag) {
        (window as any).gtag("config", GA_TRACKING_ID, {
            page_path: url,
        });
    }
};

// https://developers.google.com/analytics/devguides/collection/gtagjs/events
export const event = ({ action, category, label, value }: {
    action: string;
    category: string;
    label: string;
    value?: number;
}) => {
    if (typeof window !== "undefined" && (window as any).gtag) {
        (window as any).gtag("event", action, {
            event_category: category,
            event_label: label,
            value: value,
        });
    }
};

/**
 * Evento específico para clics en el botón de WhatsApp
 */
export const trackWhatsAppClick = (productName: string, productId: number | string) => {
    event({
        action: "whatsapp_contact",
        category: "conversion",
        label: `${productName} (${productId})`,
    });
};

/**
 * Evento específico para agregar al carrito
 */
export const trackAddToCart = (productName: string, productId: number | string, price?: number) => {
    event({
        action: "add_to_cart",
        category: "ecommerce",
        label: `${productName} (${productId})`,
        value: price,
    });
};
