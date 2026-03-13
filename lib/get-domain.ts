import { headers } from 'next/headers';

/**
 * Obtiene el dominio actual de la petición, removiendo 'www.' y el puerto.
 * @returns El dominio principal (ej: 'vestido.shop')
 */
export async function getDomain() {
    try {
        const headersList = await headers();
        const host = headersList.get('host');

        if (!host) return process.env.NEXT_PUBLIC_DEFAULT_DOMAIN || 'vestido.shop';

        const domain = host.split(':')[0].replace(/^www\./, '');

        if (domain === 'localhost' || domain === '127.0.0.1' || domain.includes('.local')) {
            return process.env.NEXT_PUBLIC_DEFAULT_DOMAIN || 'vestido.shop';
        }

        return domain;
    } catch (error) {
        // Fallback para contextos donde headers() no está disponible
        return process.env.NEXT_PUBLIC_DEFAULT_DOMAIN || 'vestido.shop';
    }
}
