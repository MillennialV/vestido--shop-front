import React from 'react';
import { PlusIcon, UploadIcon, CheckCircleIcon, DeleteIcon, WhatsappIcon, QrCodeIcon, DownloadIcon, SpinnerIcon, ExcelIcon } from "@/components/ui/Icons";

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
        <section className="mt-8 mb-8 bg-color-four/90 dark:bg-[#1a1a1a]/90 backdrop-blur-sm border border-color-three/10 dark:border-[#2a2a2a] rounded-xl shadow-sm overflow-hidden">
            <div className="p-6">
                <h2 className="text-base font-medium font-sans text-color-three dark:text-white mb-6 font-h3">Administra Catálogo</h2>

                <div className="flex flex-col gap-6">
                    {/* Fila superior: Gestión y Modo de Selección */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        {/* Grupo 1: Acciones de Catálogo (Izquierda) */}
                        <div className="flex flex-wrap items-center gap-2">
                            <button
                                onClick={onAddGarment}
                                className="inline-flex items-center gap-2 bg-color-one text-color-four font-semibold py-2 px-4 rounded-lg hover:opacity-90 transition-all text-sm shadow-sm"
                                aria-label="Añadir nuevo producto"
                            >
                                <PlusIcon className="w-4 h-4" />
                                <span>Añadir Producto</span>
                            </button>
                            <button
                                onClick={onBulkUpload}
                                className="inline-flex items-center gap-2 bg-color-four dark:bg-[#0f0f0f] text-color-three dark:text-white font-semibold py-2 px-4 rounded-lg border border-color-three/10 dark:border-[#2a2a2a] hover:bg-color-three/5 dark:hover:bg-[#1a1a1a] transition-all text-sm shadow-sm"
                            >
                                <UploadIcon className="w-4 h-4" />
                                <span>Carga Masiva</span>
                            </button>
                            <button
                                onClick={onExportExcel}
                                disabled={isExportingExcel}
                                className="inline-flex items-center gap-2 bg-color-four dark:bg-[#0f0f0f] text-color-three dark:text-white font-semibold py-2 px-4 rounded-lg border border-color-three/10 dark:border-[#2a2a2a] hover:bg-color-three/5 dark:hover:bg-[#1a1a1a] transition-all text-sm shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {isExportingExcel ? (
                                    <>
                                        <SpinnerIcon className="w-4 h-4 animate-spin text-color-two" />
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
                                    className="inline-flex items-center gap-2 bg-color-four dark:bg-[#0f0f0f] text-color-three dark:text-white font-semibold py-2 px-4 rounded-lg border border-color-three/10 dark:border-[#2a2a2a] hover:bg-color-three/5 dark:hover:bg-[#1a1a1a] transition-all text-sm shadow-sm"
                                >
                                    <DownloadIcon className="w-4 h-4" />
                                    <span>Descargar</span>
                                </button>
                            )}
                        </div>

                        {/* Grupo 2: Control de Selección (Derecha) */}
                        <div className="flex items-center gap-3">
                            {isSelectionMode && (
                                <div className="flex items-center bg-color-three/5 dark:bg-[#0f0f0f] p-1 rounded-lg border border-color-three/10 dark:border-[#2a2a2a]">
                                    <button
                                        onClick={onSelectAll}
                                        className="text-xs font-medium px-3 py-1.5 text-color-two hover:bg-white dark:hover:bg-[#1a1a1a] rounded-md transition-all"
                                    >
                                        Marcar Página
                                    </button>
                                    <div className="w-px h-4 bg-color-three/10 dark:bg-[#2a2a2a]"></div>
                                    <button
                                        onClick={onDeselectAll}
                                        className="text-xs font-medium px-3 py-1.5 text-color-disable dark:text-[#a0a0a0] hover:bg-color-four dark:hover:bg-[#1a1a1a] rounded-md transition-all"
                                    >
                                        Limpiar Todo
                                    </button>
                                </div>
                            )}
                            <button
                                onClick={onToggleSelectionMode}
                                className={`inline-flex items-center gap-2 font-semibold py-2 px-4 rounded-lg transition-all text-sm ${isSelectionMode
                                    ? 'bg-color-two text-white shadow-md hover:opacity-90'
                                    : 'bg-color-four dark:bg-[#0f0f0f] text-color-two border border-color-three/10 dark:border-[#2a2a2a] hover:bg-color-two/10 dark:hover:bg-[#1a1a1a] shadow-sm'
                                    }`}
                            >
                                <CheckCircleIcon className="w-4 h-4" />
                                <span>{isSelectionMode ? 'Cancelar Selección' : 'Seleccionar Varios'}</span>
                            </button>
                        </div>
                    </div>

                    {/* Fila Contextual: Acciones en Lote (Solo cuando hay selección) */}
                    {isSelectionMode && selectedCount > 0 && (
                        <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-color-two/10 border border-color-two/30 rounded-xl animate-in fade-in slide-in-from-top-2 duration-300">
                            <div className="flex items-center gap-2">
                                <span className="flex items-center justify-center w-6 h-6 bg-color-two text-white text-[10px] font-bold rounded-full">
                                    {selectedCount}
                                </span>
                                <span className="text-sm font-medium text-color-two">
                                    {selectedCount === 1 ? 'elemento seleccionado' : 'elementos seleccionados'}
                                </span>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                                <button
                                    onClick={onDownloadImages}
                                    className="inline-flex items-center gap-2 bg-color-four dark:bg-[#0f0f0f] text-color-three dark:text-white font-semibold py-2 px-4 rounded-lg border border-color-three/10 dark:border-[#2a2a2a] hover:bg-color-three/5 dark:hover:bg-[#1a1a1a] transition-all text-sm shadow-sm"
                                >
                                    <DownloadIcon className="w-4 h-4" />
                                    <span>Descargar Imágenes</span>
                                </button>
                                <button
                                    onClick={onGenerateQr}
                                    className="inline-flex items-center gap-2 bg-color-four dark:bg-[#0f0f0f] text-color-three dark:text-white font-semibold py-2 px-4 rounded-lg border border-color-three/10 dark:border-[#2a2a2a] hover:bg-color-three/5 dark:hover:bg-[#1a1a1a] transition-all text-sm shadow-sm"
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
                    <div className="pt-4 border-t border-color-three/10 dark:border-[#2a2a2a] flex justify-start">
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
