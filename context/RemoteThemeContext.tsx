'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { ThemeColors, StoreInfo } from '@/types/theme';

interface RemoteThemeContextType {
    colors: ThemeColors | null;
    storeInfo: StoreInfo | null;
    isLoading: boolean;
    refreshTheme: () => Promise<void>;
    updateColors: (newColors: Partial<ThemeColors>) => Promise<void>;
    updateStoreInfo: (newInfo: Partial<StoreInfo>) => Promise<void>;
}

const RemoteThemeContext = createContext<RemoteThemeContextType | undefined>(undefined);

export const RemoteThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [colors, setColors] = useState<ThemeColors | null>(null);
    const [storeInfo, setStoreInfo] = useState<StoreInfo | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const applyColors = useCallback((colors: ThemeColors) => {
        const root = document.documentElement;
        const colorMap = {
            '--color-one': colors.color_one,
            '--color-two': colors.color_two,
            '--color-three': colors.color_three,
            '--color-four': colors.color_four,
            // También establecemos las de Tailwind directamente por si acaso
            '--color-color-one': colors.color_one,
            '--color-color-two': colors.color_two,
            '--color-color-three': colors.color_three,
            '--color-color-four': colors.color_four,
        };

        Object.entries(colorMap).forEach(([key, value]) => {
            if (value) {
                root.style.setProperty(key, value);
            }
        });
    }, []);

    const fetchTheme = useCallback(async () => {
        try {
            setIsLoading(true);
            const t = Date.now();
            const [colorsRes, infoRes] = await Promise.all([
                fetch(`/api/theme/colors?t=${t}`, { cache: 'no-store' }),
                fetch(`/api/theme/store-info?t=${t}`, { cache: 'no-store' })
            ]);

            if (colorsRes.ok) {
                const colorsData = await colorsRes.json();
                if (colorsData.success && colorsData.data) {
                    console.log("[Theme] Aplicando colores:", colorsData.data);
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
        } catch (error) {
            console.error('Error fetching theme data:', error);
        } finally {
            setIsLoading(false);
        }
    }, [applyColors]);

    useEffect(() => {
        fetchTheme();
    }, [fetchTheme]);

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
                const errData = await res.json();
                throw new Error(errData.message || 'Error updating colors');
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
                const errData = await res.json();
                throw new Error(errData.message || 'Error updating store info');
            }
        } catch (error) {
            console.error('Error updating store info:', error);
            throw error;
        }
    };

    return (
        <RemoteThemeContext.Provider value={{
            colors,
            storeInfo,
            isLoading,
            refreshTheme: fetchTheme,
            updateColors,
            updateStoreInfo
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
