'use client';

import React, { useState, useEffect } from 'react';
import { useRemoteTheme } from '@/context/RemoteThemeContext';
import { CloseIcon, SpinnerIcon } from '@/components/ui/Icons';
import { ThemeColors, StoreInfo } from '@/types/theme';

interface ConfigModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const ConfigModal: React.FC<ConfigModalProps> = ({ isOpen, onClose }) => {
    const { colors, storeInfo, updateColors, updateStoreInfo } = useRemoteTheme();
    const [activeTab, setActiveTab] = useState<'colors' | 'social' | 'metadata'>('colors');
    const [localColors, setLocalColors] = useState<Partial<ThemeColors>>({});
    const [localSocial, setLocalSocial] = useState<Partial<StoreInfo>>({});
    const [localMetadata, setLocalMetadata] = useState<Partial<StoreInfo>>({});
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);


    useEffect(() => {
        if (isOpen) {
            if (colors) {
                setLocalColors({
                    color_one: colors.color_one,
                    color_two: colors.color_two,
                    color_three: colors.color_three,
                    color_four: colors.color_four,
                });
            } else {
                setLocalColors({
                    color_one: '#D5B46E',
                    color_two: '#1B1B1B',
                    color_three: '#000000',
                    color_four: '#FFFFFF',
                });
            }

            if (storeInfo) {
                setLocalSocial({
                    facebook_url: storeInfo.facebook_url || '',
                    instagram_url: storeInfo.instagram_url || '',
                });
                setLocalMetadata({
                    title: storeInfo.title || '',
                    description: storeInfo.description || '',
                    address: storeInfo.address || '',
                    email: storeInfo.email || '',
                    schedule: storeInfo.schedule || '',
                });
            } else {
                setLocalSocial({
                    facebook_url: '',
                    instagram_url: '',
                });
                setLocalMetadata({
                    title: '',
                    description: '',
                    address: '',
                    email: '',
                    schedule: '',
                });
            }
            setMessage(null);
        }
    }, [colors, storeInfo, isOpen]);

    if (!isOpen) return null;

    const handleSaveColors = async () => {
        setIsSaving(true);
        setMessage(null);
        try {
            await updateColors(localColors);
            setMessage({ type: 'success', text: 'Colores actualizados correctamente' });
            setTimeout(() => {
                onClose();
            }, 1000);
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message || 'Error al actualizar colores' });
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
                title: storeInfo?.title || localMetadata.title || "Womanity Boutique"
            });
            setMessage({ type: 'success', text: 'Redes actualizadas correctamente' });
            setTimeout(() => {
                onClose();
            }, 1000);
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message || 'Error al actualizar redes' });
        } finally {
            setIsSaving(false);
        }
    };

    const handleSaveMetadata = async () => {
        setIsSaving(true);
        setMessage(null);
        try {
            await updateStoreInfo(localMetadata);
            setMessage({ type: 'success', text: 'Información del sitio actualizada correctamente' });
            setTimeout(() => {
                onClose();
            }, 1000);
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message || 'Error al actualizar información' });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-sm animate-fade-in overflow-hidden">
            <div className="bg-color-four dark:bg-color-three rounded-none sm:rounded-[24px] shadow-2xl w-full max-w-lg overflow-hidden flex flex-col h-full sm:h-auto sm:max-h-[90vh] border-0 sm:border border-stone-200 dark:border-stone-800">
                {/* Header */}
                <div className="p-4 sm:p-6 border-b border-stone-100 dark:border-stone-800 flex justify-between items-center bg-color-four dark:bg-color-three z-10 sticky top-0">
                    <h2 className="text-lg sm:text-xl font-bold text-color-three dark:text-color-four font-serif">Configuración del Sitio</h2>
                    <button onClick={onClose} className="p-2 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-full transition-colors text-color-three dark:text-color-four">
                        <CloseIcon className="w-6 h-6" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-stone-100 dark:border-stone-800">
                    <button
                        onClick={() => setActiveTab('colors')}
                        className={`flex-1 py-3 sm:py-4 text-xs sm:text-sm font-medium transition-all ${activeTab === 'colors' ? 'text-color-three dark:text-color-four border-b-2 border-stone-900 dark:border-stone-100' : 'text-stone-400 hover:text-stone-600'}`}
                    >
                        Colores
                    </button>
                    <button
                        onClick={() => setActiveTab('social')}
                        className={`flex-1 py-3 sm:py-4 text-xs sm:text-sm font-medium transition-all ${activeTab === 'social' ? 'text-color-three dark:text-color-four border-b-2 border-stone-900 dark:border-stone-100' : 'text-stone-400 hover:text-stone-600'}`}
                    >
                        Redes
                    </button>
                    <button
                        onClick={() => setActiveTab('metadata')}
                        className={`flex-1 py-3 sm:py-4 text-xs sm:text-sm font-medium transition-all ${activeTab === 'metadata' ? 'text-color-three dark:text-color-four border-b-2 border-stone-900 dark:border-stone-100' : 'text-stone-400 hover:text-stone-600'}`}
                    >
                        Metadata
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
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 sm:gap-x-10 sm:gap-y-6">
                                {/* Color 1 */}
                                <div>
                                    <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">Color Principal (Marca)</label>
                                    <div className="flex gap-2 items-center">
                                        <div className="w-9 h-9 rounded-full overflow-hidden border border-stone-300 dark:border-stone-600 relative flex-shrink-0">
                                            <input
                                                type="color"
                                                value={localColors.color_one || '#D5B46E'}
                                                onChange={(e) => setLocalColors({ ...localColors, color_one: e.target.value })}
                                                className="absolute inset-[-100%] w-[300%] h-[300%] cursor-pointer border-none bg-transparent"
                                            />
                                        </div>
                                        <input
                                            type="text"
                                            value={localColors.color_one || '#D5B46E'}
                                            onChange={(e) => setLocalColors({ ...localColors, color_one: e.target.value })}
                                            className="input-primary flex-1 border border-stone-200 dark:border-stone-700 rounded-lg px-3 py-2 text-sm"
                                        />
                                    </div>
                                </div>
                                {/* Color 2 */}
                                <div>
                                    <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">Color Secundario</label>
                                    <div className="flex gap-2 items-center">
                                        <div className="w-9 h-9 rounded-full overflow-hidden border border-stone-300 dark:border-stone-600 relative flex-shrink-0">
                                            <input
                                                type="color"
                                                value={localColors.color_two || '#1B1B1B'}
                                                onChange={(e) => setLocalColors({ ...localColors, color_two: e.target.value })}
                                                className="absolute inset-[-100%] w-[300%] h-[300%] cursor-pointer border-none bg-transparent"
                                            />
                                        </div>
                                        <input
                                            type="text"
                                            value={localColors.color_two || '#1B1B1B'}
                                            onChange={(e) => setLocalColors({ ...localColors, color_two: e.target.value })}
                                            className="input-primary flex-1 border border-stone-200 dark:border-stone-700 rounded-lg px-3 py-2 text-sm"
                                        />
                                    </div>
                                </div>
                                {/* Color 3 */}
                                <div>
                                    <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">Color de Texto</label>
                                    <div className="flex gap-2 items-center">
                                        <div className="w-9 h-9 rounded-full overflow-hidden border border-stone-300 dark:border-stone-600 relative flex-shrink-0">
                                            <input
                                                type="color"
                                                value={localColors.color_three || '#000000'}
                                                onChange={(e) => setLocalColors({ ...localColors, color_three: e.target.value })}
                                                className="absolute inset-[-100%] w-[300%] h-[300%] cursor-pointer border-none bg-transparent"
                                            />
                                        </div>
                                        <input
                                            type="text"
                                            value={localColors.color_three || '#000000'}
                                            onChange={(e) => setLocalColors({ ...localColors, color_three: e.target.value })}
                                            className="input-primary flex-1 border border-stone-200 dark:border-stone-700 rounded-lg px-3 py-2 text-sm"
                                        />
                                    </div>
                                </div>
                                {/* Color 4 */}
                                <div>
                                    <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">Color de Fondo</label>
                                    <div className="flex gap-2 items-center">
                                        <div className="w-9 h-9 rounded-full overflow-hidden border border-stone-300 dark:border-stone-600 relative flex-shrink-0">
                                            <input
                                                type="color"
                                                value={localColors.color_four || '#FFFFFF'}
                                                onChange={(e) => setLocalColors({ ...localColors, color_four: e.target.value })}
                                                className="absolute inset-[-100%] w-[300%] h-[300%] cursor-pointer border-none bg-transparent"
                                            />
                                        </div>
                                        <input
                                            type="text"
                                            value={localColors.color_four || '#FFFFFF'}
                                            onChange={(e) => setLocalColors({ ...localColors, color_four: e.target.value })}
                                            className="input-primary flex-1 border border-stone-200 dark:border-stone-700 rounded-lg px-3 py-2 text-sm"
                                        />
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={handleSaveColors}
                                disabled={isSaving}
                                className="buttom-shop w-full font-bold py-3 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {isSaving && <SpinnerIcon className="w-4 h-4 animate-spin" />}
                                Guardar Colores
                            </button>
                        </div>
                    ) : activeTab === 'social' ? (
                        <div className="space-y-6">
                            <div>
                                <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">Facebook URL</label>
                                <input
                                    type="text"
                                    value={localSocial.facebook_url || ''}
                                    placeholder="https://facebook.com/tupagina"
                                    onChange={(e) => setLocalSocial({ ...localSocial, facebook_url: e.target.value })}
                                    className="input-primary w-full border border-stone-200 dark:border-stone-700 rounded-lg px-3 py-3 text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">Instagram URL</label>
                                <input
                                    type="text"
                                    value={localSocial.instagram_url || ''}
                                    placeholder="https://instagram.com/tucuenta"
                                    onChange={(e) => setLocalSocial({ ...localSocial, instagram_url: e.target.value })}
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
                    ) : (
                        <div className="space-y-6">
                            <div>
                                <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">Título del Sitio (SEO)</label>
                                <input
                                    type="text"
                                    value={localMetadata.title || ''}
                                    placeholder="Nombre de tu tienda"
                                    onChange={(e) => setLocalMetadata({ ...localMetadata, title: e.target.value })}
                                    className="input-primary w-full border border-stone-200 dark:border-stone-700 rounded-lg px-3 py-3 text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">Descripción (SEO)</label>
                                <textarea
                                    value={localMetadata.description || ''}
                                    placeholder="Descripción breve para Google"
                                    onChange={(e) => setLocalMetadata({ ...localMetadata, description: e.target.value })}
                                    className="input-primary w-full border border-stone-200 dark:border-stone-700 rounded-lg px-3 py-3 text-sm min-h-[80px]"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">Dirección Física</label>
                                <input
                                    type="text"
                                    value={localMetadata.address || ''}
                                    placeholder="Calle, Número, Ciudad"
                                    onChange={(e) => setLocalMetadata({ ...localMetadata, address: e.target.value })}
                                    className="input-primary w-full border border-stone-200 dark:border-stone-700 rounded-lg px-3 py-3 text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">Email de Contacto</label>
                                <input
                                    type="email"
                                    value={localMetadata.email || ''}
                                    placeholder="contacto@tienda.com"
                                    onChange={(e) => setLocalMetadata({ ...localMetadata, email: e.target.value })}
                                    className="input-primary w-full border border-stone-200 dark:border-stone-700 rounded-lg px-3 py-3 text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">Horario de Atención</label>
                                <input
                                    type="text"
                                    value={localMetadata.schedule || ''}
                                    placeholder="Lun - Vie: 9am - 6pm"
                                    onChange={(e) => setLocalMetadata({ ...localMetadata, schedule: e.target.value })}
                                    className="input-primary w-full border border-stone-200 dark:border-stone-700 rounded-lg px-3 py-3 text-sm"
                                />
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
                    )}
                </div>
            </div>
        </div>
    );
};
