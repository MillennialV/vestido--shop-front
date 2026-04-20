import React, { useState, useRef } from 'react';
import Image from 'next/image';
import { CloseIcon, PlusIcon, DeleteIcon, SpinnerIcon } from '@/components/ui/Icons';
import { convertToWebP } from '@/lib/imageUtils';

export interface BannerUploadItem {
    id: string; // ID temporal
    file: File | null;
    previewUrl: string;
    title: string;
}

interface BannerUploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUpload: (items: BannerUploadItem[]) => Promise<void>;
}

export default function BannerUploadModal({ isOpen, onClose, onUpload }: BannerUploadModalProps) {
    const [items, setItems] = useState<BannerUploadItem[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.length) return;

        const filesArray = Array.from(e.target.files);
        const newItems: BannerUploadItem[] = [];

        for (const file of filesArray) {
            try {
                // Convertimos inmediatamente a WebP con resolución de banner
                const webpFile = await convertToWebP(file, 0.9, 'banner');
                const previewUrl = URL.createObjectURL(webpFile);
                // Usamos el nombre orig sin extensión como título inicial
                const defaultTitle = file.name.replace(/\.[^/.]+$/, "");

                newItems.push({
                    id: Math.random().toString(36).substring(2, 9),
                    file: webpFile,
                    previewUrl,
                    title: defaultTitle,
                });
            } catch (err) {
                console.error("Error convirtiendo: ", err);
            }
        }

        setItems(prev => [...prev, ...newItems]);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleRemoveItem = (id: string) => {
        setItems(prev => {
            const filtered = prev.filter(item => item.id !== id);
            // Liberar memoria
            const removed = prev.find(i => i.id === id);
            if (removed) URL.revokeObjectURL(removed.previewUrl);
            return filtered;
        });
    };

    const handleTitleChange = (id: string, newTitle: string) => {
        setItems(prev => prev.map(item =>
            item.id === id ? { ...item, title: newTitle } : item
        ));
    };

    const handleUploadClick = async () => {
        if (items.length === 0) return;
        setIsUploading(true);
        try {
            await onUpload(items);
            // Limpieza al terminar
            items.forEach(item => URL.revokeObjectURL(item.previewUrl));
            setItems([]);
            onClose();
        } catch (err) {
            alert("Error al intentar subir los archivos.");
            console.error(err);
        } finally {
            setIsUploading(false);
        }
    };

    const handleClose = () => {
        if (!isUploading) {
            items.forEach(item => URL.revokeObjectURL(item.previewUrl));
            setItems([]);
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 sm:p-6 overflow-hidden">
            <div className="bg-color-four dark:bg-[#1a1a1a] rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex justify-between items-center p-6 sm:p-8 border-b border-color-three/10 dark:border-[#2a2a2a] shrink-0">
                    <div>
                        <h2 className="text-2xl font-bold text-color-three dark:text-white">Subir Banners</h2>
                        <p className="text-color-disable text-sm mt-1">Selecciona imágenes, añade un meta title a cada una y confirma la carga.</p>
                    </div>
                    <button
                        onClick={handleClose}
                        disabled={isUploading}
                        className="text-color-disable hover:text-color-three transition-colors p-2 rounded-full hover:bg-color-three/5 dark:hover:bg-[#2a2a2a] disabled:opacity-50"
                    >
                        <CloseIcon className="w-6 h-6" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 sm:p-8 overflow-y-auto flex-1 bg-color-four/50 dark:bg-[#0f0f0f]/50">
                    {items.length === 0 ? (
                        <div
                            className="border-2 border-dashed border-color-three/20 dark:border-[#2a2a2a] rounded-2xl p-12 flex flex-col items-center justify-center cursor-pointer hover:border-color-three/40 dark:hover:border-white hover:bg-color-four/80 dark:hover:bg-[#1a1a1a]/50 transition-all text-center"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <div className="w-16 h-16 bg-color-three/5 dark:bg-[#1a1a1a] rounded-full flex items-center justify-center mb-4 text-color-disable">
                                <PlusIcon className="w-8 h-8" />
                            </div>
                            <h3 className="text-lg font-medium text-color-three dark:text-stone-200">Seleccionar imágenes</h3>
                            <p className="text-stone-500 mt-2 text-sm">Soporta PNG, JPG, WEBP. Todas serán optimizadas a WEBP automáticamente.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex justify-between items-center mb-6">
                                <span className="text-sm font-medium text-stone-500">{items.length} imágenes seleccionadas</span>
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={isUploading}
                                    className="text-sm font-medium text-color-three dark:text-white bg-color-four dark:bg-[#1a1a1a] border border-color-three/10 dark:border-[#2a2a2a] hover:bg-color-three/5 dark:hover:bg-[#2a2a2a] px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                                >
                                    <PlusIcon className="w-4 h-4" /> Agregar más
                                </button>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                {items.map((item, idx) => (
                                    <div key={item.id} className="bg-color-four dark:bg-[#1a1a1a] border border-color-three/10 dark:border-[#2a2a2a] rounded-xl p-4 flex gap-4 relative group shadow-sm">
                                        <div className="relative w-24 h-24 sm:w-32 sm:h-32 rounded-lg overflow-hidden shrink-0 bg-color-three/5 dark:bg-[#0f0f0f] border border-color-three/10 dark:border-[#2a2a2a]">
                                            <Image
                                                src={item.previewUrl}
                                                alt="Preview"
                                                fill
                                                className="object-cover"
                                                unoptimized
                                            />
                                        </div>
                                        <div className="flex-1 flex flex-col justify-center min-w-0 pr-8">
                                            <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1">
                                                Meta Title / Descripción
                                            </label>
                                            <input
                                                type="text"
                                                value={item.title}
                                                onChange={(e) => handleTitleChange(item.id, e.target.value)}
                                                className="w-full bg-color-four/50 dark:bg-[#0f0f0f] text-color-three dark:text-white text-sm p-3 rounded-lg border border-color-three/10 dark:border-[#2a2a2a] focus:border-color-one dark:focus:border-white focus:ring-1 focus:ring-color-one dark:focus:ring-white outline-none transition-all placeholder:text-color-disable"
                                                placeholder="Ej: Vestido de novia colección 2026..."
                                                disabled={isUploading}
                                            />
                                            <p className="text-[10px] text-stone-400 mt-2 truncate" title={item.file?.name}>
                                                Archivo: {item.file?.name}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => handleRemoveItem(item.id)}
                                            disabled={isUploading}
                                            className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center text-stone-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                                            title="Remover"
                                        >
                                            <DeleteIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Input Oculto */}
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFilesSelected}
                        multiple
                        accept="image/*"
                        className="hidden"
                    />
                </div>

                {/* Footer */}
                <div className="p-6 sm:p-8 border-t border-color-three/10 dark:border-[#2a2a2a] bg-color-four dark:bg-[#1a1a1a] shrink-0 flex justify-end gap-3">
                    <button
                        onClick={handleClose}
                        disabled={isUploading}
                        className="px-6 py-3 font-medium text-color-three dark:text-[#a0a0a0] bg-color-three/5 dark:bg-[#0f0f0f] hover:bg-color-three/10 dark:hover:bg-[#2a2a2a] rounded-xl transition-colors disabled:opacity-50"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleUploadClick}
                        disabled={items.length === 0 || isUploading}
                        className="px-8 py-3 font-medium text-color-four bg-color-three dark:bg-white dark:text-[#0f0f0f] hover:opacity-90 rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:shadow-none flex items-center justify-center min-w-[140px]"
                    >
                        {isUploading ? (
                            <><SpinnerIcon className="w-5 h-5 mr-2 animate-spin" /> Subiendo ({items.length})...</>
                        ) : (
                            `Subir ${items.length > 0 ? items.length : ''} Banner${items.length !== 1 ? 's' : ''}`
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
