import React from 'react';
import { PlusIcon, UploadIcon, CheckCircleIcon, DeleteIcon, WhatsappIcon, QrCodeIcon, DownloadIcon, SpinnerIcon, ExcelIcon } from './Icons';

interface CatalogToolbarProps {
    onAddGarment: () => void;
    onBulkUpload: () => void;
    onToggleSelectionMode: () => void;
    isSelectionMode: boolean;
    selectedCount: number;
    onBulkDelete: () => void;
    onWhatsapp: () => void;
    onGenerateQr: () => void;
    onDownloadImages: () => void;
    onDownloadAll: () => void;
    onSelectAll: () => void;
    onDeselectAll: () => void;
    onExportExcel: () => void;
    isExportingExcel?: boolean;
}

const CatalogToolbar: React.FC<CatalogToolbarProps> = ({
    onAddGarment,
    onBulkUpload,
    onToggleSelectionMode,
    isSelectionMode,
    selectedCount,
    onBulkDelete,
    onWhatsapp,
    onGenerateQr,
    onDownloadImages,
    onDownloadAll,
    onSelectAll,
    onDeselectAll,
    onExportExcel,
    isExportingExcel = false
}) => {
    return (
        <section className="mt-8 mb-8 bg-white/90 dark:bg-stone-900/90 backdrop-blur-sm border border-stone-200 dark:border-stone-700 rounded-xl shadow-sm overflow-hidden">
            <div className="p-6">
                <h2 className="text-base font-medium font-sans text-stone-700 dark:text-stone-200 mb-6 font-h3">Administra Catálogo</h2>

                <div className="flex flex-col gap-6">
                    {/* Fila superior: Gestión y Modo de Selección */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        {/* Grupo 1: Acciones de Catálogo (Izquierda) */}
                        <div className="flex flex-wrap items-center gap-2">
                            <button
                                onClick={onAddGarment}
                                className="inline-flex items-center gap-2 bg-stone-800 dark:bg-stone-700 text-white font-semibold py-2 px-4 rounded-lg hover:bg-stone-700 dark:hover:bg-stone-600 transition-all text-sm shadow-sm"
                                aria-label="Añadir nueva prenda"
                            >
                                <PlusIcon className="w-4 h-4" />
                                <span>Añadir Prenda</span>
                            </button>
                            <button
                                onClick={onBulkUpload}
                                className="inline-flex items-center gap-2 bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-200 font-semibold py-2 px-4 rounded-lg border border-stone-200 dark:border-stone-700 hover:bg-stone-50 transition-all text-sm shadow-sm"
                            >
                                <UploadIcon className="w-4 h-4" />
                                <span>Carga Masiva</span>
                            </button>
                            <button
                                onClick={onExportExcel}
                                disabled={isExportingExcel}
                                className="inline-flex items-center gap-2 bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-200 font-semibold py-2 px-4 rounded-lg border border-stone-200 dark:border-stone-700 hover:bg-stone-50 transition-all text-sm shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {isExportingExcel ? (
                                    <>
                                        <SpinnerIcon className="w-4 h-4 animate-spin text-sky-600" />
                                        <span>Exportando...</span>
                                    </>
                                ) : (
                                    <>
                                        <ExcelIcon className="w-5 h-5 text-green-600 dark:text-green-500" />
                                        <span>Exportar</span>
                                    </>
                                )}
                            </button>
                            {!isSelectionMode && (
                                <button
                                    onClick={onDownloadAll}
                                    className="inline-flex items-center gap-2 bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-200 font-semibold py-2 px-4 rounded-lg border border-stone-200 dark:border-stone-700 hover:bg-stone-50 transition-all text-sm shadow-sm"
                                >
                                    <DownloadIcon className="w-4 h-4" />
                                    <span>Descargar</span>
                                </button>
                            )}
                        </div>

                        {/* Grupo 2: Control de Selección (Derecha) */}
                        <div className="flex items-center gap-3">
                            {isSelectionMode && (
                                <div className="flex items-center bg-stone-100 dark:bg-stone-800/50 p-1 rounded-lg">
                                    <button
                                        onClick={onSelectAll}
                                        className="text-xs font-medium px-3 py-1.5 text-sky-600 dark:text-sky-400 hover:bg-white dark:hover:bg-stone-700 rounded-md transition-all"
                                    >
                                        Marcar Página
                                    </button>
                                    <div className="w-px h-4 bg-stone-300 dark:bg-stone-600"></div>
                                    <button
                                        onClick={onDeselectAll}
                                        className="text-xs font-medium px-3 py-1.5 text-stone-500 hover:bg-white dark:hover:bg-stone-700 rounded-md transition-all"
                                    >
                                        Limpiar Todo
                                    </button>
                                </div>
                            )}
                            <button
                                onClick={onToggleSelectionMode}
                                className={`inline-flex items-center gap-2 font-semibold py-2 px-4 rounded-lg transition-all text-sm ${isSelectionMode
                                    ? 'bg-sky-600 text-white shadow-md hover:bg-sky-700'
                                    : 'bg-white dark:bg-stone-800 text-sky-700 dark:text-sky-400 border border-sky-100 dark:border-stone-700 hover:bg-sky-50 shadow-sm'
                                    }`}
                            >
                                <CheckCircleIcon className="w-4 h-4" />
                                <span>{isSelectionMode ? 'Cancelar Selección' : 'Seleccionar Varios'}</span>
                            </button>
                        </div>
                    </div>

                    {/* Fila Contextual: Acciones en Lote (Solo cuando hay selección) */}
                    {isSelectionMode && selectedCount > 0 && (
                        <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-sky-50/50 dark:bg-sky-900/10 border border-sky-100 dark:border-sky-800/30 rounded-xl animate-in fade-in slide-in-from-top-2 duration-300">
                            <div className="flex items-center gap-2">
                                <span className="flex items-center justify-center w-6 h-6 bg-sky-600 text-white text-[10px] font-bold rounded-full">
                                    {selectedCount}
                                </span>
                                <span className="text-sm font-medium text-sky-800 dark:text-sky-300">
                                    {selectedCount === 1 ? 'elemento seleccionado' : 'elementos seleccionados'}
                                </span>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                                <button
                                    onClick={onDownloadImages}
                                    className="inline-flex items-center gap-2 bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-200 font-semibold py-2 px-4 rounded-lg border border-stone-200 dark:border-stone-700 hover:bg-stone-50 transition-all text-sm shadow-sm"
                                >
                                    <DownloadIcon className="w-4 h-4" />
                                    <span>Descargar Imágenes</span>
                                </button>
                                <button
                                    onClick={onDownloadImages}
                                    className="inline-flex items-center gap-2 bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-200 font-semibold py-2.5 px-5 rounded-lg border border-stone-300 dark:border-stone-600 hover:bg-stone-50 dark:hover:bg-stone-700 hover:border-stone-400 dark:hover:border-stone-500 active:bg-stone-100 dark:active:bg-stone-600 transition-all duration-200 text-sm shadow-sm hover:shadow-md"
                                    aria-label={`Descargar imágenes de ${selectedCount} prendas`}
                                >
                                    <DownloadIcon className="w-4 h-4" />
                                    <span>Descargar</span>
                                </button>
                                <button
                                    onClick={onGenerateQr}
                                    className="inline-flex items-center gap-2 bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-200 font-semibold py-2 px-4 rounded-lg border border-stone-200 dark:border-stone-700 hover:bg-stone-50 transition-all text-sm shadow-sm"
                                >
                                    <QrCodeIcon className="w-4 h-4" />
                                    <span>Generar QR</span>
                                </button>
                                <button
                                    onClick={onBulkDelete}
                                    className="inline-flex items-center gap-2 bg-rose-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-rose-700 active:bg-rose-800 transition-all text-sm shadow-md"
                                >
                                    <DeleteIcon className="w-4 h-4" />
                                    <span>Eliminar Selección</span>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Fila Inferior: Configuración Extra */}
                    <div className="pt-4 border-t border-stone-100 dark:border-stone-800 flex justify-start">
                        <button
                            onClick={onWhatsapp}
                            className="inline-flex items-center gap-2 bg-[#25D366] text-white font-semibold py-2 px-4 rounded-lg hover:bg-[#20BA5A] transition-all text-sm shadow-sm"
                            aria-label="Agregar número de WhatsApp para contacto"
                        >
                            <WhatsappIcon className="w-5 h-5 text-white" />
                            <span className="drop-shadow-[0_1px_1px_rgba(0,0,0,0.3)]">Configura número</span>
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default CatalogToolbar;
