import { getDomain } from './get-domain';
import { ThemeColors, StoreInfo } from '@/types/theme';

const THEME_API_URL = process.env.NEXT_PUBLIC_THEME_SERVICE_URL || 'http://localhost:3008';

export async function getRemoteThemeData() {
    const domain = await getDomain();
    
    try {
        const [colorsRes, infoRes] = await Promise.all([
            fetch(`${THEME_API_URL}/api/theme-colors?domain=${domain}`, { next: { revalidate: 3600 } }),
            fetch(`${THEME_API_URL}/api/store-info?domain=${domain}`, { next: { revalidate: 3600 } })
        ]);

        let colors: ThemeColors | null = null;
        let storeInfo: StoreInfo | null = null;

        if (colorsRes.ok) {
            const data = await colorsRes.json();
            if (data.success) colors = data.data;
        }

        if (infoRes.ok) {
            const data = await infoRes.json();
            if (data.success) storeInfo = data.data;
        }

        return { colors, storeInfo };
    } catch (error) {
        console.error('Error fetching remote theme data:', error);
        return { colors: null, storeInfo: null };
    }
}
