import React from 'react';
import { PlusIcon, UploadIcon, CheckCircleIcon, DeleteIcon, WhatsappIcon } from './Icons';

interface CatalogToolbarProps {
    onAddGarment: () => void;
    onBulkUpload: () => void;
    onToggleSelectionMode: () => void;
    isSelectionMode: boolean;
    selectedCount: number;
    onBulkDelete: () => void;
    onWhatsapp: () => void;
}

const CatalogToolbar: React.FC<CatalogToolbarProps> = ({
    onAddGarment,
    onBulkUpload,
    onToggleSelectionMode,
    isSelectionMode,
    selectedCount,
    onBulkDelete,
    onWhatsapp
}) => {
    return (
        <section className="mt-8 mb-8 bg-white/90 dark:bg-stone-900/90 backdrop-blur-sm border border-stone-200 dark:border-stone-700 rounded-xl shadow-sm overflow-hidden">
            <div className="p-6">
                <h2 className="text-base font-medium font-sans text-stone-700 dark:text-stone-200 mb-4">Administra Catálogo</h2>
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                    {/* Sección de acciones principales */}
                    <div className="flex flex-wrap items-center gap-3">
                        <button
                            onClick={onAddGarment}
                            className="inline-flex items-center gap-2 bg-stone-800 dark:bg-stone-700 text-white font-semibold py-2.5 px-5 rounded-lg hover:bg-stone-700 dark:hover:bg-stone-600 active:bg-stone-900 dark:active:bg-stone-800 transition-all duration-200 text-sm shadow-md hover:shadow-lg"
                        >
                            <PlusIcon className="w-4 h-4" />
                            <span>Añadir Prenda</span>
                        </button>
                        <button
                            onClick={onBulkUpload}
                            className="inline-flex items-center gap-2 bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-200 font-semibold py-2.5 px-5 rounded-lg border border-stone-300 dark:border-stone-600 hover:bg-stone-50 dark:hover:bg-stone-700 hover:border-stone-400 dark:hover:border-stone-500 active:bg-stone-100 dark:active:bg-stone-600 transition-all duration-200 text-sm shadow-sm hover:shadow-md"
                        >
                            <UploadIcon className="w-4 h-4" />
                            <span>Carga Masiva</span>
                        </button>
                    </div>

                    {/* Sección de selección múltiple */}
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="h-6 w-px bg-sky-300 dark:bg-white hidden lg:block"></div>
                        <button
                            onClick={onToggleSelectionMode}
                            className={`inline-flex items-center gap-2 font-semibold py-2.5 px-5 rounded-lg transition-all duration-200 text-sm ${isSelectionMode
                                ? 'bg-sky-600 text-white shadow-md hover:bg-sky-700 hover:shadow-lg'
                                : 'bg-white dark:bg-stone-800 text-sky-700 dark:text-white border border-sky-300 dark:border-stone-600 hover:bg-sky-50 dark:hover:bg-stone-700 hover:border-sky-400 dark:hover:border-stone-500 shadow-sm hover:shadow-md'
                                }`}
                        >
                            <CheckCircleIcon className={`w-4 h-4 ${isSelectionMode ? '' : 'opacity-70'}`} />
                            <span>{isSelectionMode ? 'Cancelar Selección' : 'Seleccionar Múltiples'}</span>
                        </button>
                        {isSelectionMode && selectedCount > 0 && (
                            <button
                                onClick={onBulkDelete}
                                className="inline-flex items-center gap-2 bg-red-600 dark:bg-red-700 text-white font-semibold py-2.5 px-5 rounded-lg hover:bg-red-700 dark:hover:bg-red-600 active:bg-red-800 dark:active:bg-red-800 transition-all duration-200 text-sm shadow-md hover:shadow-lg"
                            >
                                <DeleteIcon className="w-4 h-4" />
                                <span>Eliminar</span>
                                <span className="ml-1 bg-red-700/50 px-2 py-0.5 rounded-full text-xs font-semibold">
                                    {selectedCount}
                                </span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Botón de WhatsApp */}
                <div className="mt-6 pt-6 border-t border-sky-200 dark:border-white">
                    <button
                        onClick={onWhatsapp}
                        className="inline-flex items-center gap-2 bg-[#25D366] text-white font-semibold py-2.5 px-5 rounded-lg hover:bg-[#20BA5A] active:bg-[#1DA851] transition-all duration-200 text-sm shadow-md hover:shadow-lg"
                    >
                        <WhatsappIcon className="w-5 h-5" />
                        <span>Agrega número</span>
                    </button>
                </div>
            </div>
        </section>
    );
};

export default CatalogToolbar;
