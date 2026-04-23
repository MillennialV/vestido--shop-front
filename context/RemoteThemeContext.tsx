'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { ThemeColors, StoreInfo, StoreMetadata } from '@/types/theme';

interface RemoteThemeContextType {
    colors: ThemeColors | null;
    storeInfo: StoreInfo | null;
    metadata: StoreMetadata | null;
    isLoading: boolean;
    refreshTheme: () => Promise<void>;
    updateColors: (newColors: Partial<ThemeColors>) => Promise<void>;
    updateStoreInfo: (newInfo: Partial<StoreInfo>) => Promise<void>;
    updateMetadata: (newMetadata: Partial<StoreMetadata> | FormData) => Promise<void>;
    organization: any | null;
}

const RemoteThemeContext = createContext<RemoteThemeContextType | undefined>(undefined);

export const RemoteThemeProvider: React.FC<{ 
    children: React.ReactNode,
    initialColors?: ThemeColors | null,
    initialStoreInfo?: StoreInfo | null,
    initialMetadata?: StoreMetadata | null,
    initialOrganization?: any | null
}> = ({ 
    children, 
    initialColors = null, 
    initialStoreInfo = null, 
    initialMetadata = null, 
    initialOrganization = null 
}) => {
    const [colors, setColors] = useState<ThemeColors | null>(initialColors);
    const [storeInfo, setStoreInfo] = useState<StoreInfo | null>(initialStoreInfo);
    const [metadata, setMetadata] = useState<StoreMetadata | null>(initialMetadata);
    const [organization, setOrganization] = useState<any | null>(initialOrganization);
    const [isLoading, setIsLoading] = useState(!initialColors && !initialStoreInfo);

    const applyColors = useCallback((colors: ThemeColors) => {
        if (typeof window === 'undefined') return;
        const root = document.documentElement;
        const colorMap = {
            '--color-one': colors.color_one,
            '--color-two': colors.color_two,
            '--color-three': colors.color_four,
            '--color-four': colors.color_three,
            '--color-color-one': colors.color_one,
            '--color-color-two': colors.color_two,
            '--color-color-three': colors.color_four,
            '--color-color-four': colors.color_three,
        };

        Object.entries(colorMap).forEach(([key, value]) => {
            if (value) {
                root.style.setProperty(key, value);
            }
        });
    }, []);

    const fetchTheme = useCallback(async () => {
        try {
            // La carga inicial ya está manejada por el estado de useState
            const t = Date.now();
            const [colorsRes, infoRes, metaRes, orgRes] = await Promise.all([
                fetch(`/api/theme/colors?t=${t}`, { cache: 'no-store' }),
                fetch(`/api/theme/store-info?t=${t}`, { cache: 'no-store' }),
                fetch(`/api/theme/metadata?t=${t}`, { cache: 'no-store' }),
                fetch(`/api/organization/public?t=${t}`, { cache: 'no-store' })
            ]);

            if (colorsRes.ok) {
                const colorsData = await colorsRes.json();
                if (colorsData.success && colorsData.data) {
                    setColors(colorsData.data);
                    applyColors(colorsData.data);
                }
            }

            if (infoRes.ok) {
                const infoData = await infoRes.json();
                if (infoData.success && infoData.data) {
                    setStoreInfo(infoData.data);
                }
            }

            if (metaRes.ok) {
                const metaData = await metaRes.json();
                if (metaData.success && metaData.data) {
                    setMetadata(metaData.data);
                }
            }

            if (orgRes && orgRes.ok) {
                const orgData = await orgRes.json();
                if (orgData.success && orgData.data?.organization) {
                    setOrganization(orgData.data.organization);
                }
            }
        } catch (error) {
            console.error('Error fetching theme data:', error);
        } finally {
            setIsLoading(false);
        }
    }, [applyColors]);

    useEffect(() => {
        // Si ya tenemos datos iniciales, no es estrictamente necesario el fetch inmediato
        // pero lo dejamos para asegurar que el cliente esté sincronizado si hubo cambios rápidos
        fetchTheme();
    }, [fetchTheme]);

    useEffect(() => {
        if (typeof window !== 'undefined' && storeInfo?.title) {
            document.title = storeInfo.title;
        }
    }, [storeInfo?.title]);

    const updateColors = async (newColors: Partial<ThemeColors>) => {
        try {
            const method = colors?.id ? 'PUT' : 'POST';
            const body = colors?.id ? { id: colors.id, ...newColors } : newColors;
            
            const res = await fetch('/api/theme/colors', {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            if (res.ok) {
                await fetchTheme();
            } else {
                const errData = await res.json().catch(() => ({}));
                const error = new Error(errData.message || 'Error updating colors');
                (error as any).status = res.status;
                throw error;
            }
        } catch (error) {
            console.error('Error updating colors:', error);
            throw error;
        }
    };

    const updateStoreInfo = async (newInfo: Partial<StoreInfo>) => {
        try {
            const method = storeInfo?.id ? 'PUT' : 'POST';
            const body = storeInfo?.id ? { id: storeInfo.id, ...newInfo } : newInfo;

            const res = await fetch('/api/theme/store-info', {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            if (res.ok) {
                await fetchTheme();
            } else {
                const errData = await res.json().catch(() => ({}));
                const error = new Error(errData.message || 'Error updating store info');
                (error as any).status = res.status;
                throw error;
            }
        } catch (error) {
            console.error('Error updating store info:', error);
            throw error;
        }
    };

    const updateMetadata = async (newMetadata: Partial<StoreMetadata> | FormData) => {
        try {
            const isFormData = newMetadata instanceof FormData;
            const method = metadata?.id ? 'PUT' : 'POST';
            const url = metadata?.id ? `/api/theme/metadata/${metadata.id}` : '/api/theme/metadata';
            
            const headers: Record<string, string> = {};
            let body: any;

            if (isFormData) {
                // Si es un update (PUT) y lo enviamos como FormData, el ID debe estar en el FormData
                // o lo pasamos en la URL si el proxy lo permite.
                body = newMetadata;
            } else {
                headers['Content-Type'] = 'application/json';
                body = JSON.stringify(metadata?.id ? { id: metadata.id, ...newMetadata } : newMetadata);
            }

            const res = await fetch(url, {
                method,
                headers,
                body
            });

            if (res.ok) {
                await fetchTheme();
            } else {
                const errData = await res.json().catch(() => ({}));
                const error = new Error(errData.message || 'Error updating metadata');
                (error as any).status = res.status;
                throw error;
            }
        } catch (error) {
            console.error('Error updating metadata:', error);
            throw error;
        }
    };

    return (
        <RemoteThemeContext.Provider value={{
            colors,
            storeInfo,
            metadata,
            isLoading,
            refreshTheme: fetchTheme,
            updateColors,
            updateStoreInfo,
            updateMetadata,
            organization
        }}>
            {children}
        </RemoteThemeContext.Provider>
    );
};

export const useRemoteTheme = () => {
    const context = useContext(RemoteThemeContext);
    if (context === undefined) {
        throw new Error('useRemoteTheme must be used within a RemoteThemeProvider');
    }
    return context;
};
