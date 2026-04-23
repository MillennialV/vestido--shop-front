'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useRemoteTheme } from '@/context/RemoteThemeContext';
import { CloseIcon, SpinnerIcon, InfoIcon } from '@/components/ui/Icons';
import { ThemeColors, StoreInfo, StoreMetadata } from '@/types/theme';
import { DEFAULT_STORE_INFO } from '@/lib/constants';

const LabelWithInfo: React.FC<{ label: string, info: string, htmlFor: string }> = ({ label, info, htmlFor }) => {
    const [showTooltip, setShowTooltip] = useState(false);
    const [coords, setCoords] = useState({ top: 0, left: 0, arrowLeft: '50%' });
    const iconRef = useRef<HTMLButtonElement>(null);

    const updateCoords = () => {
        if (iconRef.current) {
            const rect = iconRef.current.getBoundingClientRect();
            const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 0;
            const tooltipWidth = Math.min(256, viewportWidth - 32);
            const halfWidth = tooltipWidth / 2;

            let iconCenter = rect.left + rect.width / 2;
            let tooltipLeft = iconCenter;

            // Ajustar si se sale por los bordes (clamping)
            if (iconCenter < halfWidth + 16) {
                tooltipLeft = halfWidth + 16;
            } else if (iconCenter > viewportWidth - halfWidth - 16) {
                tooltipLeft = viewportWidth - halfWidth - 16;
            }

            // Calcular posición de la flecha relativa al centro del tooltip para que apunte al icono
            const offset = iconCenter - tooltipLeft;
            const arrowLeft = `calc(50% + ${offset}px)`;

            setCoords({
                top: rect.bottom + window.scrollY,
                left: tooltipLeft + window.scrollX,
                arrowLeft
            });
        }
    };

    return (
        <div className="flex items-center gap-2 mb-2">
            <label htmlFor={htmlFor} className="block text-xs font-bold text-[var(--color-threes)] uppercase tracking-wider mb-0 cursor-pointer">
                {label}
            </label>
            <div className="relative flex items-center">
                <button
                    ref={iconRef}
                    type="button"
                    onMouseEnter={() => {
                        updateCoords();
                        setShowTooltip(true);
                    }}
                    onMouseLeave={() => setShowTooltip(false)}
                    onClick={() => {
                        updateCoords();
                        setShowTooltip(!showTooltip);
                    }}
                    className="text-[var(--color-threes)] hover:text-stone-600 transition-colors"
                >
                    <InfoIcon className="w-3.5 h-3.5" />
                </button>
                {showTooltip && typeof document !== 'undefined' && createPortal(
                    <div
                        style={{
                            position: 'absolute',
                            top: `${coords.top + 8}px`,
                            left: `${coords.left}px`,
                            transform: 'translateX(-50%)',
                            width: '256px',
                            maxWidth: 'calc(100vw - 32px)'
                        }}
                        className="p-3 bg-stone-900 text-white text-[11px] leading-relaxed rounded-lg shadow-2xl z-[10000] animate-fade-in pointer-events-none whitespace-normal text-center"
                    >
                        <div
                            style={{ left: coords.arrowLeft }}
                            className="absolute bottom-full -translate-x-1/2 border-8 border-transparent border-b-stone-900"
                        ></div>
                        {info}
                    </div>,
                    document.body
                )}
            </div>
        </div>
    );
};

interface ConfigModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAuthError?: (message: string) => void;
}

export const ConfigModal: React.FC<ConfigModalProps> = ({ isOpen, onClose, onAuthError }) => {
    const { colors, storeInfo, metadata, updateColors, updateStoreInfo, updateMetadata } = useRemoteTheme();
    const [activeTab, setActiveTab] = useState<'colors' | 'social' | 'metadata' | 'links'>('colors');
    const [localColors, setLocalColors] = useState<Partial<ThemeColors>>({});
    const [localSocial, setLocalSocial] = useState<Partial<StoreInfo>>({});
    const [localMetadata, setLocalMetadata] = useState<Partial<StoreInfo>>({});
    const [localSEO, setLocalSEO] = useState<Partial<StoreMetadata>>({});
    const [localLinks, setLocalLinks] = useState<Partial<StoreInfo>>({});
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [tempKeyword, setTempKeyword] = useState('');
    const [isExpanded, setIsExpanded] = useState(false);


    useEffect(() => {
        if (isOpen) {
            // Solo inicializamos si los estados locales están vacíos o si el modal se acaba de abrir
            // Esto evita que actualizaciones en segundo plano sobrescriban lo que el usuario está editando
            if (colors) {
                setLocalColors(prev => Object.keys(prev).length === 0 ? {
                    color_one: colors.color_one,
                    color_two: colors.color_two,
                    color_three: colors.color_three,
                    color_four: colors.color_four,
                } : prev);
            }

            if (storeInfo) {
                setLocalSocial(prev => Object.keys(prev).length === 0 ? {
                    facebook_url: storeInfo.facebook_url || '',
                    instagram_url: storeInfo.instagram_url || '',
                    whatsapp: storeInfo.whatsapp || '',
                    is_carousel_enabled: storeInfo.is_carousel_enabled ?? true,
                } : prev);

                setLocalMetadata(prev => {
                    const newValue = Object.keys(prev).length === 0 ? {
                        title: storeInfo.title || '',
                        description: storeInfo.description || '',
                        address: storeInfo.address || '',
                        email: storeInfo.email || '',
                        schedule: storeInfo.schedule || '',
                    } : prev;
                    // Sincronizar título de pestaña para previsualización
                    if (newValue.title && typeof document !== 'undefined') {
                        document.title = newValue.title;
                    }
                    return newValue;
                });

                setLocalLinks(prev => Object.keys(prev).length === 0 ? {
                    terms_url: storeInfo.terms_url || '',
                    privacy_url: storeInfo.privacy_url || '',
                    shipping_url: storeInfo.shipping_url || '',
                    footer_license: storeInfo.footer_license || '',
                } : prev);
            }

            if (metadata) {
                setLocalSEO(prev => Object.keys(prev).length === 0 ? {
                    keywords: metadata.keywords || '',
                    google_site_verification: metadata.google_site_verification || '',
                    og_image_default: metadata.og_image_default || '',
                } : prev);
            }
        } else {
            // Restaurar título original si se cierra sin guardar
            if (storeInfo?.title && typeof document !== 'undefined' && document.title !== storeInfo.title) {
                document.title = storeInfo.title;
            }
            // Cuando el modal se cierra, limpiamos los estados locales para que se vuelvan a llenar al abrir
            setLocalColors({});
            setLocalSocial({});
            setLocalMetadata({});
            setLocalLinks({});
            setLocalSEO({});
            setMessage(null);
        }
    }, [isOpen, colors, storeInfo, metadata]);

    if (!isOpen) return null;

    const handleSaveColors = async () => {
        setIsSaving(true);
        setMessage(null);
        try {
            await Promise.all([
                updateColors(localColors),
                updateStoreInfo({ is_carousel_enabled: localSocial.is_carousel_enabled })
            ]);
            setMessage({ type: 'success', text: 'Configuración actualizada correctamente' });
            onClose();
        } catch (error: any) {
            if (error?.status === 401 || (error instanceof Error && error.message.includes('401'))) {
                if (onAuthError) {
                    onAuthError("Tu sesión ha expirado. Por favor, inicia sesión de nuevo para continuar.");
                }
                onClose();
                return;
            }
            setMessage({ type: 'error', text: error.message || 'Error al actualizar configuración' });
        } finally {
            setIsSaving(false);
        }
    };

    const handleSaveSocial = async () => {
        setIsSaving(true);
        setMessage(null);
        try {
            await updateStoreInfo({
                ...localSocial,
                title: storeInfo?.title || localMetadata.title || DEFAULT_STORE_INFO.title
            });
            setMessage({ type: 'success', text: 'Redes actualizadas correctamente' });
            onClose();
        } catch (error: any) {
            if (error?.status === 401 || (error instanceof Error && error.message.includes('401'))) {
                if (onAuthError) {
                    onAuthError("Tu sesión ha expirado. Por favor, inicia sesión de nuevo para continuar.");
                }
                onClose();
                return;
            }
            setMessage({ type: 'error', text: error.message || 'Error al actualizar redes' });
        } finally {
            setIsSaving(false);
        }
    };

    const handleSaveMetadata = async () => {
        setIsSaving(true);
        setMessage(null);
        try {
            // Preparar FormData para enviar los metadatos (necesario para el archivo)
            const formData = new FormData();
            
            // Añadir campos de SEO
            if (localSEO.keywords) formData.append('keywords', localSEO.keywords);
            if (localSEO.google_site_verification) formData.append('google_site_verification', localSEO.google_site_verification);
            
            // Si hay un archivo seleccionado, enviarlo como 'enlace'
            if (localSEO.enlace instanceof File) {
                formData.append('enlace', localSEO.enlace);
            }

            await Promise.all([
                updateStoreInfo(localMetadata),
                updateMetadata(formData)
            ]);
            setMessage({ type: 'success', text: 'Información y SEO actualizados correctamente' });
            onClose();
        } catch (error: any) {
            if (error?.status === 401 || (error instanceof Error && error.message.includes('401'))) {
                if (onAuthError) {
                    onAuthError("Tu sesión ha expirado. Por favor, inicia sesión de nuevo para continuar.");
                }
                onClose();
                return;
            }
            setMessage({ type: 'error', text: error.message || 'Error al actualizar información' });
        } finally {
            setIsSaving(false);
        }
    };

    const handleSaveLinks = async () => {
        setIsSaving(true);
        setMessage(null);
        try {
            await updateStoreInfo(localLinks);
            setMessage({ type: 'success', text: 'Enlaces legales actualizados correctamente' });
            onClose();
        } catch (error: any) {
            if (error?.status === 401 || (error instanceof Error && error.message.includes('401'))) {
                if (onAuthError) {
                    onAuthError("Tu sesión ha expirado. Por favor, inicia sesión de nuevo para continuar.");
                }
                onClose();
                return;
            }
            setMessage({ type: 'error', text: error.message || 'Error al actualizar enlaces' });
        } finally {
            setIsSaving(false);
        }
    };

    const addKeyword = () => {
        const val = tempKeyword.trim();
        if (!val) return;

        const currentKeywords = (localSEO.keywords || '').split(',').map(k => k.trim()).filter(Boolean);
        if (!currentKeywords.includes(val)) {
            const newList = [...currentKeywords, val].join(', ');
            setLocalSEO({ ...localSEO, keywords: newList });
        }
        setTempKeyword('');
    };

    const removeKeyword = (keywordToRemove: string) => {
        const currentKeywords = (localSEO.keywords || '').split(',').map(k => k.trim()).filter(Boolean);
        const newList = currentKeywords.filter(k => k !== keywordToRemove).join(', ');
        setLocalSEO({ ...localSEO, keywords: newList });
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-sm animate-fade-in overflow-hidden">
            <div className="bg-color-four dark:bg-[#1a1a1a] rounded-none sm:rounded-[24px] shadow-2xl w-full max-w-lg overflow-hidden flex flex-col h-full sm:h-auto sm:max-h-[90vh] border-0 sm:border border-stone-200 dark:border-[#2a2a2a]">
                {/* Header */}
                <div className="p-4 sm:p-6 border-b border-stone-100 dark:border-[#2a2a2a] flex justify-between items-center bg-color-four dark:bg-[#1a1a1a] z-10 sticky top-0">
                    <h2 className="text-lg sm:text-xl font-bold text-color-three dark:text-white font-serif">Configuración del Sitio</h2>
                    <button onClick={onClose} className="p-2 hover:bg-stone-100 dark:hover:bg-[#2a2a2a] rounded-full transition-colors text-color-three dark:text-white">
                        <CloseIcon className="w-6 h-6" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-stone-100 dark:border-[#2a2a2a]">
                    <button
                        onClick={() => setActiveTab('colors')}
                        className={`flex-1 py-3 sm:py-4 text-xs sm:text-sm font-medium transition-all ${activeTab === 'colors' ? 'text-color-three dark:text-white border-b-2 border-stone-900 dark:border-white' : 'text-[var(--color-threes)] hover:text-stone-600'}`}
                    >
                        Colores
                    </button>
                    <button
                        onClick={() => setActiveTab('social')}
                        className={`flex-1 py-3 sm:py-4 text-xs sm:text-sm font-medium transition-all ${activeTab === 'social' ? 'text-color-three dark:text-white border-b-2 border-stone-900 dark:border-white' : 'text-[var(--color-threes)] hover:text-stone-600'}`}
                    >
                        Redes
                    </button>
                    <button
                        onClick={() => setActiveTab('metadata')}
                        className={`flex-1 py-3 sm:py-4 text-xs sm:text-sm font-medium transition-all ${activeTab === 'metadata' ? 'text-color-three dark:text-white border-b-2 border-stone-900 dark:border-white' : 'text-[var(--color-threes)] hover:text-stone-600'}`}
                    >
                        Metadata
                    </button>
                    <button
                        onClick={() => setActiveTab('links')}
                        className={`flex-1 py-3 sm:py-4 text-xs sm:text-sm font-medium transition-all ${activeTab === 'links' ? 'text-color-three dark:text-white border-b-2 border-stone-900 dark:border-white' : 'text-[var(--color-threes)] hover:text-stone-600'}`}
                    >
                        Enlaces
                    </button>
                </div>

                {/* Content */}
                <div className="p-4 sm:p-6 overflow-y-auto flex-1 custom-scrollbar">
                    {message && (
                        <div className={`p-4 mb-4 rounded-xl text-sm font-medium ${message.type === 'success' ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400' : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'}`}>
                            {message.text}
                        </div>
                    )}

                    {activeTab === 'colors' ? (
                        <div className="space-y-6">
                            {/* ... labels and color selectors ... */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 sm:gap-x-6 sm:gap-y-6">
                                {/* Color 1 */}
                                <div>
                                    <LabelWithInfo
                                        htmlFor="color_one"
                                        label="Color Principal (Marca)"
                                        info="El tono dominante que define la identidad de tu tienda. Se aplica en botones, enlaces y elementos destacados."
                                    />
                                    <div className="flex gap-2 items-center">
                                        <div className="w-9 h-9 rounded-full overflow-hidden border border-stone-300 dark:border-stone-600 relative flex-shrink-0">
                                            <input
                                                id="color_one_picker"
                                                name="color_one_picker"
                                                type="color"
                                                value={localColors.color_one || ''}
                                                onChange={(e) => setLocalColors({ ...localColors, color_one: e.target.value })}
                                                className="absolute inset-[-100%] w-[300%] h-[300%] cursor-pointer border-none bg-transparent"
                                            />
                                        </div>
                                        <input
                                            id="color_one"
                                            name="color_one"
                                            type="text"
                                            value={localColors.color_one || ''}
                                            placeholder="Color principal"
                                            onChange={(e) => setLocalColors({ ...localColors, color_one: e.target.value })}
                                            className="input-primary w-full min-w-0 flex-1 border border-stone-200 dark:border-stone-700 rounded-lg px-3 py-2 text-sm"
                                        />
                                    </div>
                                </div>
                                {/* Color 2 */}
                                <div>
                                    <LabelWithInfo
                                        htmlFor="color_two"
                                        label="Color Secundario"
                                        info="Color complementario para crear variedad visual sin competir con el principal."
                                    />
                                    <div className="flex gap-2 items-center">
                                        <div className="w-9 h-9 rounded-full overflow-hidden border border-stone-300 dark:border-stone-600 relative flex-shrink-0">
                                            <input
                                                id="color_two_picker"
                                                name="color_two_picker"
                                                type="color"
                                                value={localColors.color_two || ''}
                                                onChange={(e) => setLocalColors({ ...localColors, color_two: e.target.value })}
                                                className="absolute inset-[-100%] w-[300%] h-[300%] cursor-pointer border-none bg-transparent"
                                            />
                                        </div>
                                        <input
                                            id="color_two"
                                            name="color_two"
                                            type="text"
                                            value={localColors.color_two || ''}
                                            placeholder="Color secundario"
                                            onChange={(e) => setLocalColors({ ...localColors, color_two: e.target.value })}
                                            className="input-primary w-full min-w-0 flex-1 border border-stone-200 dark:border-stone-700 rounded-lg px-3 py-2 text-sm"
                                        />
                                    </div>
                                </div>
                                {/* Color 3 */}
                                <div>
                                    <LabelWithInfo
                                        htmlFor="color_three"
                                        label="Color de Fondo"
                                        info="Color sutil para fondos de secciones o tarjetas, creando jerarquía visual sin saturar."
                                    />
                                    <div className="flex gap-2 items-center">
                                        <div className="w-9 h-9 rounded-full overflow-hidden border border-stone-300 dark:border-stone-600 relative flex-shrink-0">
                                            <input
                                                id="color_three_picker"
                                                name="color_three_picker"
                                                type="color"
                                                value={localColors.color_three || ''}
                                                onChange={(e) => setLocalColors({ ...localColors, color_three: e.target.value })}
                                                className="absolute inset-[-100%] w-[300%] h-[300%] cursor-pointer border-none bg-transparent"
                                            />
                                        </div>
                                        <input
                                            id="color_three"
                                            name="color_three"
                                            type="text"
                                            value={localColors.color_three || ''}
                                            placeholder="Color de fondo"
                                            onChange={(e) => setLocalColors({ ...localColors, color_three: e.target.value })}
                                            className="input-primary w-full min-w-0 flex-1 border border-stone-200 dark:border-stone-700 rounded-lg px-3 py-2 text-sm"
                                        />
                                    </div>
                                </div>
                                {/* Color 4 */}
                                <div>
                                    <LabelWithInfo
                                        htmlFor="color_four"
                                        label="Color de Texto"
                                        info="Define el tono principal de la tipografía para asegurar una lectura cómoda en todo el sitio."
                                    />
                                    <div className="flex gap-2 items-center">
                                        <div className="w-9 h-9 rounded-full overflow-hidden border border-stone-300 dark:border-stone-600 relative flex-shrink-0">
                                            <input
                                                id="color_four_picker"
                                                name="color_four_picker"
                                                type="color"
                                                value={localColors.color_four || ''}
                                                onChange={(e) => setLocalColors({ ...localColors, color_four: e.target.value })}
                                                className="absolute inset-[-100%] w-[300%] h-[300%] cursor-pointer border-none bg-transparent"
                                            />
                                        </div>
                                        <input
                                            id="color_four"
                                            name="color_four"
                                            type="text"
                                            value={localColors.color_four || ''}
                                            placeholder="Color de texto"
                                            onChange={(e) => setLocalColors({ ...localColors, color_four: e.target.value })}
                                            className="input-primary w-full min-w-0 flex-1 border border-stone-200 dark:border-stone-700 rounded-lg px-3 py-2 text-sm"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Banner Toggle Switch */}
                            <div className="pt-4 border-t border-stone-100 dark:border-[#2a2a2a] flex items-center justify-between">
                                <div className="flex flex-col">
                                    <span className="text-xs font-bold text-[var(--color-threes)] uppercase tracking-wider">Configuración de Pantalla</span>
                                    <span className="text-[11px] text-[var(--color-threes)]">Habilitar o deshabilitar el banner principal de la tienda.</span>
                                </div>
                                <button
                                    onClick={() => setLocalSocial({ ...localSocial, is_carousel_enabled: !localSocial.is_carousel_enabled })}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${localSocial.is_carousel_enabled ? 'bg-stone-900 dark:bg-white' : 'bg-stone-200 dark:bg-stone-800'}`}
                                >
                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white dark:bg-[#1a1a1a] transition-transform ${localSocial.is_carousel_enabled ? 'translate-x-6' : 'translate-x-1'}`} />
                                </button>
                            </div>

                            <button
                                onClick={handleSaveColors}
                                disabled={isSaving}
                                className="buttom-shop w-full font-bold py-3 transition-all disabled:opacity-50 flex items-center justify-center gap-2 dark:bg-white dark:text-[#0f0f0f] dark:hover:bg-stone-200"
                            >
                                {isSaving && <SpinnerIcon className="w-4 h-4 animate-spin" />}
                                Guardar Colores
                            </button>
                        </div>
                    ) : activeTab === 'social' ? (
                        <div className="space-y-6">
                            <div>
                                <LabelWithInfo
                                    htmlFor="facebook_url"
                                    label="Facebook URL"
                                    info="Enlace directo a tu fanpage de Facebook. Aparecerá como icono en el encabezado y pie de página."
                                />
                                <input
                                    id="facebook_url"
                                    name="facebook_url"
                                    type="text"
                                    value={localSocial.facebook_url || ''}
                                    placeholder="Enlace de Facebook"
                                    onChange={(e) => setLocalSocial({ ...localSocial, facebook_url: e.target.value })}
                                    className="input-primary w-full border border-stone-200 dark:border-stone-700 rounded-lg px-3 py-3 text-sm"
                                />
                            </div>
                            <div>
                                <LabelWithInfo
                                    htmlFor="instagram_url"
                                    label="Instagram URL"
                                    info="Enlace directo a tu perfil de Instagram. Ideal para mostrar tu catálogo visual."
                                />
                                <input
                                    id="instagram_url"
                                    name="instagram_url"
                                    type="text"
                                    value={localSocial.instagram_url || ''}
                                    placeholder="Enlace de Instagram"
                                    onChange={(e) => setLocalSocial({ ...localSocial, instagram_url: e.target.value })}
                                    className="input-primary w-full border border-stone-200 dark:border- stone-700 rounded-lg px-3 py-3 text-sm"
                                />
                            </div>
                            <div>
                                <LabelWithInfo
                                    htmlFor="whatsapp"
                                    label="WhatsApp (ej: 51999888777)"
                                    info="Tu número de WhatsApp con código de país. Permitirá a los clientes contactarte con un clic."
                                />
                                <input
                                    id="whatsapp"
                                    name="whatsapp"
                                    type="text"
                                    value={localSocial.whatsapp || ''}
                                    placeholder="Número de WhatsApp"
                                    onChange={(e) => setLocalSocial({ ...localSocial, whatsapp: e.target.value })}
                                    className="input-primary w-full border border-stone-200 dark:border-stone-700 rounded-lg px-3 py-3 text-sm"
                                />
                            </div>
                            <button
                                onClick={handleSaveSocial}
                                disabled={isSaving}
                                className="buttom-shop w-full font-bold py-3 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {isSaving && <SpinnerIcon className="w-4 h-4 animate-spin" />}
                                Guardar Redes
                            </button>
                        </div>
                    ) : activeTab === 'metadata' ? (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <LabelWithInfo
                                        htmlFor="seo_title"
                                        label="Título del Sitio (SEO)"
                                        info="Este es el título que verán los usuarios en Google y en la pestaña del navegador. Idealmente entre 50 y 60 caracteres."
                                    />
                                    <input
                                        id="seo_title"
                                        name="seo_title"
                                        type="text"
                                        value={localMetadata.title || ''}
                                        placeholder="Título del sitio"
                                        onChange={(e) => {
                                            const newTitle = e.target.value;
                                            setLocalMetadata({ ...localMetadata, title: newTitle });
                                            if (typeof document !== 'undefined') {
                                                document.title = newTitle || storeInfo?.title || DEFAULT_STORE_INFO.title;
                                            }
                                        }}
                                        className="input-primary w-full border border-stone-200 dark:border-stone-700 rounded-lg px-3 py-3 text-sm"
                                    />
                                </div>
                                <div>
                                    <LabelWithInfo
                                        htmlFor="google_site_verification"
                                        label="Google Verification"
                                        info="Código para verificar la propiedad del sitio en Google Search Console y empezar a rastrear tu tráfico SEO."
                                    />
                                    <input
                                        id="google_site_verification"
                                        name="google_site_verification"
                                        type="text"
                                        value={localSEO.google_site_verification || ''}
                                        placeholder="Código de verificación"
                                        onChange={(e) => setLocalSEO({ ...localSEO, google_site_verification: e.target.value })}
                                        className="input-primary w-full border border-stone-200 dark:border-stone-700 rounded-lg px-3 py-3 text-sm"
                                    />
                                </div>
                            </div>
                            <div>
                                <LabelWithInfo
                                    htmlFor="seo_description"
                                    label="Descripción (SEO)"
                                    info="Resumen corto que aparece debajo del título en Google. Debe ser atractivo para que los usuarios hagan clic."
                                />
                                <textarea
                                    id="seo_description"
                                    name="seo_description"
                                    value={localMetadata.description || ''}
                                    placeholder="Descripción del sitio"
                                    onChange={(e) => setLocalMetadata({ ...localMetadata, description: e.target.value })}
                                    className="input-primary w-full border border-stone-200 dark:border-stone-700 rounded-lg px-3 py-3 text-sm min-h-[80px]"
                                />
                            </div>
                            <div>
                                <LabelWithInfo
                                    htmlFor="og_image_default"
                                    label="Imagen OG por defecto"
                                    info="Esta imagen aparecerá cuando compartas el enlace de tu tienda por WhatsApp, Facebook o Instagram."
                                />
                                <div className="space-y-4">
                                    {/* Previsualización o imagen actual */}
                                    {(localSEO.enlace || localSEO.og_image_default) && (
                                        <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-[#0f0f0f] flex items-center justify-center">
                                            <img
                                                src={localSEO.enlace instanceof File ? URL.createObjectURL(localSEO.enlace) : (localSEO.og_image_default || '')}
                                                alt="OG Preview"
                                                className="max-w-full max-h-full object-contain"
                                            />
                                            {localSEO.enlace instanceof File && (
                                                <div className="absolute top-2 right-2 px-2 py-1 bg-stone-900/80 text-white text-[10px] rounded-md backdrop-blur-sm">
                                                    Previsualización
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Botón de subida custom */}
                                    <label className="block">
                                        <div className="cursor-pointer flex items-center justify-center gap-2 w-full px-4 py-3 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-300 rounded-xl transition-all border border-stone-200 dark:border-stone-700 font-bold text-xs uppercase tracking-wider">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1M16 8l-4-4m0 0L8 8m4-4v12" />
                                            </svg>
                                            {localSEO.enlace instanceof File ? 'Cambiar Imagen' : 'Subir Imagen OG'}
                                        </div>
                                        <input
                                            id="og_image_default"
                                            name="og_image_default"
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) {
                                                    setLocalSEO({ ...localSEO, enlace: file });
                                                }
                                            }}
                                        />
                                    </label>
                                </div>
                            </div>
                            <div>
                                <LabelWithInfo
                                    htmlFor="keywords"
                                    label="Keywords (etiquetas)"
                                    info="Presiona Enter o haz clic en + para añadir una palabra clave. Haz clic en la x de cada etiqueta para eliminarla."
                                />
                                <div className="space-y-3">
                                    <div className="flex gap-2">
                                        <input
                                            id="keywords_input"
                                            name="keywords_input"
                                            type="text"
                                            value={tempKeyword}
                                            placeholder="Nueva palabra clave..."
                                            onChange={(e) => setTempKeyword(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    addKeyword();
                                                }
                                            }}
                                            className="input-primary flex-1 border border-stone-200 dark:border-stone-700 rounded-lg px-3 py-3 text-sm"
                                        />
                                        <button
                                            type="button"
                                            onClick={addKeyword}
                                            className="px-4 py-2 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-300 rounded-lg transition-colors font-bold text-xl leading-none flex items-center justify-center"
                                        >
                                            +
                                        </button>
                                    </div>

                                    <div className="flex flex-wrap gap-2 min-h-[40px] p-3 bg-stone-50 dark:bg-[#0f0f0f]/50 rounded-xl border border-dashed border-stone-200 dark:border-[#2a2a2a]">
                                        {(() => {
                                            const keywords = (localSEO.keywords || '').split(',').map(k => k.trim()).filter(Boolean);
                                            if (keywords.length === 0) {
                                                return <span className="text-[11px] text-[var(--color-threes)] italic p-1">No hay palabras clave añadidas.</span>;
                                            }

                                            const displayedKeywords = isExpanded ? keywords : keywords.slice(0, 4);
                                            return (
                                                <>
                                                    {displayedKeywords.map((kw, i) => (
                                                        <div
                                                            key={i}
                                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-[#2a2a2a] border border-stone-200 dark:border-[#3a3a3a] rounded-full text-[11px] font-medium text-stone-600 dark:text-white shadow-sm animate-fade-in"
                                                        >
                                                            <span>{kw}</span>
                                                            <button
                                                                type="button"
                                                                onClick={() => removeKeyword(kw)}
                                                                className="w-4 h-4 flex items-center justify-center hover:bg-stone-100 dark:hover:bg-[#3a3a3a] rounded-full text-[var(--color-threes)] hover:text-red-500 transition-colors"
                                                            >
                                                                <CloseIcon className="w-2.5 h-2.5" />
                                                            </button>
                                                        </div>
                                                    ))}
                                                    {keywords.length > 4 && (
                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                setIsExpanded(!isExpanded);
                                                            }}
                                                            className="text-[11px] font-bold text-[var(--color-threes)] hover:text-stone-900 dark:hover:text-stone-100 transition-colors px-2 py-1.5"
                                                        >
                                                            {isExpanded ? 'Ver menos' : `Ver más (${keywords.length - 4})`}
                                                        </button>
                                                    )}
                                                </>
                                            );
                                        })()}
                                    </div>
                                </div>
                            </div>
                            <div className="pt-4 border-t border-stone-100 dark:border-stone-800">
                                <h3 className="text-xs font-bold text-[var(--color-threes)] uppercase mb-4">Información de Contacto</h3>
                                <div className="space-y-4">
                                    <div>
                                        <LabelWithInfo
                                            htmlFor="contact_address"
                                            label="Dirección Física"
                                            info="La ubicación de tu showroom o local físico que aparecerá en el pie de página y en Google Maps."
                                        />
                                        <input
                                            id="contact_address"
                                            name="contact_address"
                                            type="text"
                                            value={localMetadata.address || ''}
                                            placeholder="Dirección"
                                            onChange={(e) => setLocalMetadata({ ...localMetadata, address: e.target.value })}
                                            className="input-primary w-full border border-stone-200 dark:border-stone-700 rounded-lg px-3 py-3 text-sm"
                                        />
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <LabelWithInfo
                                                htmlFor="contact_email"
                                                label="Email"
                                                info="Correo de contacto para consultas de clientes."
                                            />
                                            <input
                                                id="contact_email"
                                                name="contact_email"
                                                type="email"
                                                value={localMetadata.email || ''}
                                                placeholder="Correo electrónico"
                                                onChange={(e) => setLocalMetadata({ ...localMetadata, email: e.target.value })}
                                                className="input-primary w-full border border-stone-200 dark:border-stone-700 rounded-lg px-3 py-3 text-sm"
                                            />
                                        </div>
                                        <div>
                                            <LabelWithInfo
                                                htmlFor="contact_schedule"
                                                label="Horario"
                                                info="Tus días y horas de atención al público (ej: Lun - Sáb: 10AM - 8PM)."
                                            />
                                            <input
                                                id="contact_schedule"
                                                name="contact_schedule"
                                                type="text"
                                                value={localMetadata.schedule || ''}
                                                placeholder="Horario de atención"
                                                onChange={(e) => setLocalMetadata({ ...localMetadata, schedule: e.target.value })}
                                                className="input-primary w-full border border-stone-200 dark:border-stone-700 rounded-lg px-3 py-3 text-sm"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={handleSaveMetadata}
                                disabled={isSaving}
                                className="buttom-shop w-full font-bold py-3 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {isSaving && <SpinnerIcon className="w-4 h-4 animate-spin" />}
                                Guardar Información
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div>
                                <LabelWithInfo
                                    htmlFor="terms_url"
                                    label="Términos y Condiciones (URL)"
                                    info="Enlace a la página donde explicas las reglas de uso de tu sitio. Si está vacío, el enlace se ocultará en el pie de página."
                                />
                                <input
                                    id="terms_url"
                                    name="terms_url"
                                    type="text"
                                    value={localLinks.terms_url || ''}
                                    placeholder="Enlace de términos"
                                    onChange={(e) => setLocalLinks({ ...localLinks, terms_url: e.target.value })}
                                    className="input-primary w-full border border-stone-200 dark:border-stone-700 rounded-lg px-3 py-3 text-sm"
                                />
                            </div>
                            <div>
                                <LabelWithInfo
                                    htmlFor="privacy_url"
                                    label="Política de Privacidad (URL)"
                                    info="URL del documento que explica cómo proteges los datos de tus clientes."
                                />
                                <input
                                    id="privacy_url"
                                    name="privacy_url"
                                    type="text"
                                    value={localLinks.privacy_url || ''}
                                    placeholder="Enlace de privacidad"
                                    onChange={(e) => setLocalLinks({ ...localLinks, privacy_url: e.target.value })}
                                    className="input-primary w-full border border-stone-200 dark:border-stone-700 rounded-lg px-3 py-3 text-sm"
                                />
                            </div>
                            <div>
                                <LabelWithInfo
                                    htmlFor="shipping_url"
                                    label="Políticas de Envío (URL)"
                                    info="Enlace con los detalles de tiempos y costos de entrega. Ayuda a generar confianza antes de la compra."
                                />
                                <input
                                    id="shipping_url"
                                    name="shipping_url"
                                    type="text"
                                    value={localLinks.shipping_url || ''}
                                    placeholder="Enlace de envíos"
                                    onChange={(e) => setLocalLinks({ ...localLinks, shipping_url: e.target.value })}
                                    className="input-primary w-full border border-stone-200 dark:border-stone-700 rounded-lg px-3 py-3 text-sm"
                                />
                            </div>
                            <div>
                                <LabelWithInfo
                                    htmlFor="footer_license"
                                    label="Licencia / Texto Footer"
                                    info="El texto de derechos reservados que aparece al final de todo el sitio. Ejemplo: © 2026 Nombre de tu Empresa."
                                />
                                <input
                                    id="footer_license"
                                    name="footer_license"
                                    type="text"
                                    value={localLinks.footer_license || ''}
                                    placeholder="Texto del pie de página"
                                    onChange={(e) => setLocalLinks({ ...localLinks, footer_license: e.target.value })}
                                    className="input-primary w-full border border-stone-200 dark:border-stone-700 rounded-lg px-3 py-3 text-sm"
                                />
                            </div>
                            <button
                                onClick={handleSaveLinks}
                                disabled={isSaving}
                                className="buttom-shop w-full font-bold py-3 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {isSaving && <SpinnerIcon className="w-4 h-4 animate-spin" />}
                                Guardar Enlaces Legal
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
