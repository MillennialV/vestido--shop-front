import { getDomain } from './get-domain';
import { ThemeColors, StoreInfo, StoreMetadata } from '@/types/theme';
import { cookies } from 'next/headers';

const THEME_API_URL = process.env.NEXT_PUBLIC_THEME_SERVICE_URL || 'http://localhost:3008';

export async function getRemoteThemeData(): Promise<{ 
    colors: ThemeColors | null; 
    storeInfo: StoreInfo | null; 
    metadata: StoreMetadata | null; 
}> {
    const domain = await getDomain();
    const cookieStore = await cookies();
    const token = cookieStore.get("authToken")?.value;
    const headers: Record<string, string> = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'es-ES,es;q=0.9',
    };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    
    try {
        console.log(`[getRemoteThemeData] Fetching for domain: ${domain}`);
        const [colorsRes, infoRes, metaRes] = await Promise.all([
            fetch(`${THEME_API_URL}/api/theme-colors?domain=${domain}`, { headers, next: { revalidate: 3600 } }),
            fetch(`${THEME_API_URL}/api/store-info?domain=${domain}`, { headers, next: { revalidate: 3600 } }),
            fetch(`${THEME_API_URL}/api/store-metadata?domain=${domain}`, { headers, next: { revalidate: 3600 } })
        ]);

        let colors: ThemeColors | null = null;
        let storeInfo: StoreInfo | null = null;
        let metadata: StoreMetadata | null = null;

        if (infoRes.ok) {
            const data = await infoRes.json();
            console.log(`[getRemoteThemeData] infoRes body for ${domain}:`, JSON.stringify(data));
            if (data.success) storeInfo = data.data;
        }

        if (metaRes.ok) {
            const data = await metaRes.json();
            if (data.success) metadata = data.data;
        }

        if (colorsRes.ok) {
            const data = await colorsRes.json();
            if (data.success) colors = data.data;
        }

        // Fallback si no se encontró información y el dominio tiene www
        const cleanDomain = domain.replace(/^www\./, '');
        if ((!storeInfo || !metadata || !colors) && domain !== cleanDomain) {
            console.log(`[getRemoteThemeData] Retrying with clean domain: ${cleanDomain}`);
            const [cRes, iRes, mRes] = await Promise.all([
                !colors ? fetch(`${THEME_API_URL}/api/theme-colors?domain=${cleanDomain}`, { headers, next: { revalidate: 3600 } }) : Promise.resolve(null),
                !storeInfo ? fetch(`${THEME_API_URL}/api/store-info?domain=${cleanDomain}`, { headers, next: { revalidate: 3600 } }) : Promise.resolve(null),
                !metadata ? fetch(`${THEME_API_URL}/api/store-metadata?domain=${cleanDomain}`, { headers, next: { revalidate: 3600 } }) : Promise.resolve(null)
            ]);

            if (iRes && iRes.ok) {
                const data = await iRes.json();
                if (data.success) storeInfo = data.data;
            }
            if (mRes && mRes.ok) {
                const data = await mRes.json();
                if (data.success) metadata = data.data;
            }
            if (cRes && cRes.ok) {
                const data = await cRes.json();
                if (data.success) colors = data.data;
            }
        }

        return { colors, storeInfo, metadata };
    } catch (error) {
        console.error(`[getRemoteThemeData] Error for domain ${domain}:`, error);
        return { colors: null, storeInfo: null, metadata: null };
    }
}
