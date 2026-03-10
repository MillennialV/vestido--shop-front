import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { CloseIcon, SpinnerIcon, UploadIcon } from '@/components/ui/Icons';
import { Banner } from '@/hooks/useBanners';
import { convertToWebP } from '@/lib/imageUtils';

interface BannerEditModalProps {
    isOpen: boolean;
    banner: Banner | null;
    onClose: () => void;
    onSave: (id: string, updates: Partial<Banner>, file?: File) => Promise<void>;
}

export default function BannerEditModal({ isOpen, banner, onClose, onSave }: BannerEditModalProps) {
    const [title, setTitle] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Sincronizar estado cuando el banner cambia
    useEffect(() => {
        if (banner) {
            setTitle(banner.title || '');
            setPreviewUrl(banner.image_url);
            setFile(null); // Reseteamos archivo nuevo al abrir
        }
    }, [banner, isOpen]);

    if (!isOpen || !banner) return null;

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.length) return;
        const selectedFile = e.target.files[0];
        try {
            const webpFile = await convertToWebP(selectedFile, 0.9);
            const newPreview = URL.createObjectURL(webpFile);
            setFile(webpFile);
            setPreviewUrl(newPreview);
        } catch (err) {
            console.error("Error convirtiendo a WebP:", err);
            alert("Error procesando la imagen a WebP.");
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await onSave(banner.id, { title }, file || undefined);

            // Clean up si creamos objectURL
            if (file && previewUrl && previewUrl.startsWith('blob:')) {
                URL.revokeObjectURL(previewUrl);
            }
            onClose();
        } catch (err: any) {
            alert("Error al guardar: " + err.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleClose = () => {
        if (file && previewUrl && previewUrl.startsWith('blob:')) {
            URL.revokeObjectURL(previewUrl);
        }
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 sm:p-6 overflow-hidden">
            <div className="bg-white dark:bg-stone-900 rounded-3xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="flex justify-between items-center p-6 sm:p-8 border-b border-stone-100 dark:border-stone-800 shrink-0">
                    <h2 className="text-xl font-bold text-stone-900 dark:text-stone-100">Editar Banner</h2>
                    <button
                        onClick={handleClose}
                        disabled={isSaving}
                        className="text-stone-400 hover:text-stone-600 transition-colors p-2 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 disabled:opacity-50"
                    >
                        <CloseIcon className="w-6 h-6" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 sm:p-8 overflow-y-auto flex-1 bg-stone-50/50 dark:bg-stone-900/50 space-y-6">

                    {/* Imagen Preview */}
                    <div>
                        <label className="block text-sm font-semibold text-stone-700 dark:text-stone-300 mb-2">
                            Imagen del Banner
                        </label>
                        <div className="relative w-full h-48 sm:h-56 bg-stone-100 dark:bg-stone-800 rounded-2xl overflow-hidden group border border-stone-200 dark:border-stone-700">
                            {previewUrl && (
                                <Image
                                    src={previewUrl}
                                    alt="Preview banner"
                                    fill
                                    className="object-cover"
                                    unoptimized
                                />
                            )}
                            {/* Overlay hover para cambiar imagen */}
                            <div
                                onClick={() => !isSaving && fileInputRef.current?.click()}
                                className="absolute rounded-2xl inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer backdrop-blur-sm"
                            >
                                <UploadIcon className="w-8 h-8 text-white mb-2" />
                                <span className="text-white text-sm font-medium">Reemplazar imagen (.webp)</span>
                            </div>
                        </div>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            accept="image/*"
                            className="hidden"
                            disabled={isSaving}
                        />
                        {file && (
                            <p className="text-xs text-green-600 dark:text-green-400 mt-2 font-medium">
                                Nueva imagen seleccionada: {file.name}
                            </p>
                        )}
                    </div>

                    {/* Meta Title */}
                    <div>
                        <label className="block text-sm font-semibold text-stone-700 dark:text-stone-300 mb-2">
                            Meta Title / Descripción
                        </label>
                        <input
                            type="text"
                            className="w-full p-3 border border-stone-300 dark:border-stone-600 rounded-xl text-stone-900 dark:text-stone-100 bg-white dark:bg-stone-900 focus:ring-2 focus:ring-stone-500 outline-none transition-all placeholder:text-stone-400"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Ingrese un título descriptivo"
                            disabled={isSaving}
                        />
                    </div>

                </div>

                {/* Footer */}
                <div className="p-6 sm:p-8 border-t border-stone-100 dark:border-stone-800 bg-white dark:bg-stone-900 shrink-0 flex justify-end gap-3">
                    <button
                        onClick={handleClose}
                        disabled={isSaving}
                        className="px-6 py-3 font-medium text-stone-600 dark:text-stone-300 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 rounded-xl transition-colors disabled:opacity-50"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving || !title.trim()}
                        className="px-8 py-3 font-medium text-white bg-stone-900 dark:bg-stone-100 dark:text-stone-900 hover:bg-stone-800 dark:hover:bg-white rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:shadow-none min-w-[140px] flex items-center justify-center"
                    >
                        {isSaving ? (
                            <><SpinnerIcon className="w-5 h-5 mr-2 animate-spin" /> Guardando...</>
                        ) : (
                            'Guardar Cambios'
                        )}
                    </button>
                </div>

            </div>
        </div>
    );
}
