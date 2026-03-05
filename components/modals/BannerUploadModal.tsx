import React, { useState, useRef } from 'react';
import Image from 'next/image';
import { CloseIcon, PlusIcon, DeleteIcon, SpinnerIcon } from '@/components/Icons';
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
                // Convertimos inmediatamente a WebP
                const webpFile = await convertToWebP(file, 0.9);
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
            <div className="bg-white dark:bg-stone-900 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex justify-between items-center p-6 sm:p-8 border-b border-stone-100 dark:border-stone-800 shrink-0">
                    <div>
                        <h2 className="text-2xl font-bold text-stone-900 dark:text-stone-100">Subir Banners</h2>
                        <p className="text-stone-500 text-sm mt-1">Selecciona imágenes, añade un meta title a cada una y confirma la carga.</p>
                    </div>
                    <button
                        onClick={handleClose}
                        disabled={isUploading}
                        className="text-stone-400 hover:text-stone-600 transition-colors p-2 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 disabled:opacity-50"
                    >
                        <CloseIcon className="w-6 h-6" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 sm:p-8 overflow-y-auto flex-1 bg-stone-50/50 dark:bg-stone-900/50">
                    {items.length === 0 ? (
                        <div
                            className="border-2 border-dashed border-stone-300 dark:border-stone-700 rounded-2xl p-12 flex flex-col items-center justify-center cursor-pointer hover:border-stone-500 dark:hover:border-stone-500 hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-all text-center"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <div className="w-16 h-16 bg-stone-100 dark:bg-stone-800 rounded-full flex items-center justify-center mb-4 text-stone-400">
                                <PlusIcon className="w-8 h-8" />
                            </div>
                            <h3 className="text-lg font-medium text-stone-900 dark:text-stone-200">Seleccionar imágenes</h3>
                            <p className="text-stone-500 mt-2 text-sm">Soporta PNG, JPG, WEBP. Todas serán optimizadas a WEBP automáticamente.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex justify-between items-center mb-6">
                                <span className="text-sm font-medium text-stone-500">{items.length} imágenes seleccionadas</span>
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={isUploading}
                                    className="text-sm font-medium text-stone-900 dark:text-stone-100 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 hover:bg-stone-100 px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                                >
                                    <PlusIcon className="w-4 h-4" /> Agregar más
                                </button>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                {items.map((item, idx) => (
                                    <div key={item.id} className="bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl p-4 flex gap-4 relative group shadow-sm">
                                        <div className="relative w-24 h-24 sm:w-32 sm:h-32 rounded-lg overflow-hidden shrink-0 bg-stone-100 dark:bg-stone-900 border border-stone-100 dark:border-stone-700">
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
                                                className="w-full bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-stone-100 text-sm p-3 rounded-lg border border-stone-200 dark:border-stone-700 focus:border-stone-500 focus:ring-1 focus:ring-stone-500 outline-none transition-all placeholder:text-stone-400"
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
                <div className="p-6 sm:p-8 border-t border-stone-100 dark:border-stone-800 bg-white dark:bg-stone-900 shrink-0 flex justify-end gap-3">
                    <button
                        onClick={handleClose}
                        disabled={isUploading}
                        className="px-6 py-3 font-medium text-stone-600 dark:text-stone-300 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 rounded-xl transition-colors disabled:opacity-50"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleUploadClick}
                        disabled={items.length === 0 || isUploading}
                        className="px-8 py-3 font-medium text-white bg-stone-900 dark:bg-stone-100 dark:text-stone-900 hover:bg-stone-800 dark:hover:bg-white rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:shadow-none flex items-center justify-center min-w-[140px]"
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
