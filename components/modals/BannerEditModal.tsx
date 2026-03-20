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
            <div className="bg-color-four dark:bg-[#1a1a1a] rounded-3xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="flex justify-between items-center p-6 sm:p-8 border-b border-color-three/10 dark:border-[#2a2a2a] shrink-0">
                    <h2 className="text-xl font-bold text-color-three dark:text-white">Editar Banner</h2>
                    <button
                        onClick={handleClose}
                        disabled={isSaving}
                        className="text-color-disable hover:text-color-three transition-colors p-2 rounded-full hover:bg-color-three/5 dark:hover:bg-[#2a2a2a] disabled:opacity-50"
                    >
                        <CloseIcon className="w-6 h-6" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 sm:p-8 overflow-y-auto flex-1 bg-color-four/50 dark:bg-[#0f0f0f]/50 space-y-6">

                    {/* Imagen Preview */}
                    <div>
                        <label className="block text-sm font-semibold text-stone-700 dark:text-[#a0a0a0] mb-2">
                            Imagen del Banner
                        </label>
                        <div className="relative w-full h-48 sm:h-56 bg-color-three/5 dark:bg-[#0f0f0f] rounded-2xl overflow-hidden group border border-color-three/10 dark:border-[#2a2a2a]">
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
                        <label className="block text-sm font-semibold text-stone-700 dark:text-[#a0a0a0] mb-2">
                            Meta Title / Descripción
                        </label>
                        <input
                            type="text"
                            className="w-full p-3 border border-color-three/20 dark:border-[#2a2a2a] rounded-xl text-color-three dark:text-white bg-color-four dark:bg-[#0f0f0f] focus:ring-2 focus:ring-color-one dark:focus:ring-white outline-none transition-all placeholder:text-color-disable"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Ingrese un título descriptivo"
                            disabled={isSaving}
                        />
                    </div>

                </div>

                {/* Footer */}
                <div className="p-6 sm:p-8 border-t border-color-three/10 dark:border-[#2a2a2a] bg-color-four dark:bg-[#1a1a1a] shrink-0 flex justify-end gap-3">
                    <button
                        onClick={handleClose}
                        disabled={isSaving}
                        className="px-6 py-3 font-medium text-color-three dark:text-[#a0a0a0] bg-color-three/5 dark:bg-[#0f0f0f] hover:bg-color-three/10 dark:hover:bg-[#2a2a2a] rounded-xl transition-colors disabled:opacity-50"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving || !title.trim()}
                        className="px-8 py-3 font-medium text-color-four bg-color-three dark:bg-white dark:text-[#0f0f0f] hover:opacity-90 rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:shadow-none min-w-[140px] flex items-center justify-center"
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
