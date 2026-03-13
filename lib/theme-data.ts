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
    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;
    
    try {
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
            if (data.success) {
                storeInfo = data.data;
            } else {
                console.warn(`[getRemoteThemeData] infoRes success=false for ${domain}:`, data);
            }
        } else {
            console.warn(`[getRemoteThemeData] infoRes not ok: ${infoRes.status} for ${domain}`);
        }

        if (metaRes.ok) {
            const data = await metaRes.json();
            if (data.success) metadata = data.data;
        }

        if (colorsRes.ok) {
            const data = await colorsRes.json();
            if (data.success) colors = data.data;
        }

        return { colors, storeInfo, metadata };
    } catch (error) {
        console.error(`[getRemoteThemeData] Error for domain ${domain}:`, error);
        return { colors: null, storeInfo: null, metadata: null };
    }
}
