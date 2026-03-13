import { headers } from 'next/headers';

/**
 * Obtiene el dominio actual de la petición, removiendo solo el puerto.
 * @returns El dominio (ej: 'www.vestido.shop' o 'vestido.shop')
 */
export async function getDomain() {
    try {
        const headersList = await headers();
        const host = headersList.get('host');

        if (!host) return process.env.NEXT_PUBLIC_DEFAULT_DOMAIN || 'www.vestido.shop';

        const domain = host.split(':')[0];

        if (domain === 'localhost' || domain === '127.0.0.1' || domain.includes('.local')) {
            return process.env.NEXT_PUBLIC_DEFAULT_DOMAIN || 'www.vestido.shop';
        }

        return domain;
    } catch (error) {
        return process.env.NEXT_PUBLIC_DEFAULT_DOMAIN || 'www.vestido.shop';
    }
}
