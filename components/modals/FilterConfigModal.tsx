
import React, { useState, useEffect } from 'react';
import { CloseIcon, PlusIcon } from "@/components/ui/Icons";

interface FilterConfigModalProps {
    isOpen: boolean;
    onClose: () => void;
    availableAttributes: string[];
    activeKeys: string[];
    onSave: (newKeys: string[]) => Promise<void>;
}

const FilterConfigModal: React.FC<FilterConfigModalProps> = ({
    isOpen,
    onClose,
    availableAttributes,
    activeKeys,
    onSave
}) => {
    const [selectedKeys, setSelectedKeys] = useState<string[]>(activeKeys);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setSelectedKeys(activeKeys);
        }
    }, [isOpen, activeKeys]);

    const handleToggleKey = (key: string) => {
        if (key === 'brand') return; // Marca es obligatoria
        setSelectedKeys(prev =>
            prev.includes(key)
                ? prev.filter(k => k !== key)
                : [...prev, key]
        );
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await onSave(selectedKeys);
            onClose();
        } catch (error) {
            console.error("Error saving filter config:", error);
            alert("Error al guardar la configuración");
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in shadow-2xl">
            <div className="bg-white dark:bg-[#121212] rounded-[32px] w-full max-w-lg overflow-hidden flex flex-col border border-stone-200/50 dark:border-[#2a2a2a] shadow-2xl ring-1 ring-black/5">
                {/* Header */}
                <div className="px-8 py-6 border-b border-stone-100 dark:border-[#2a2a2a] flex items-center justify-between bg-gradient-to-r from-stone-50/50 to-white dark:from-[#1a1a1a] dark:to-[#121212]">
                    <div>
                        <h2 className="text-xl font-bold text-stone-900 dark:text-white">Configurar Filtros</h2>
                        <p className="text-sm text-stone-500 dark:text-[#a0a0a0] mt-1">Selecciona qué campos aparecerán en la tienda</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-stone-100 dark:hover:bg-[#2a2a2a] rounded-full transition-colors group"
                    >
                        <CloseIcon className="w-5 h-5 text-stone-400 group-hover:text-stone-600 dark:group-hover:text-white" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-8 overflow-y-auto max-h-[60vh] custom-scrollbar">
                    <div className="space-y-4">
                        <p className="text-xs font-bold text-stone-400 dark:text-[#666] uppercase tracking-wider mb-2">Campos de Producto</p>

                        {/* Campo Fijo: Marca */}
                        <div className="flex items-center justify-between p-4 rounded-2xl bg-stone-50 dark:bg-[#1a1a1a] border border-stone-100 dark:border-[#2a2a2a] opacity-60">
                            <div className="flex items-center gap-3">
                                <div>
                                    <span className="font-semibold text-stone-700 dark:text-white">Marca</span>
                                    <span className="ml-2 px-1.5 py-0.5 text-[10px] bg-stone-200 dark:bg-[#2a2a2a] text-stone-500 rounded uppercase">Obligatorio</span>
                                </div>
                            </div>
                            <input type="checkbox" checked readOnly className="w-5 h-5 accent-[#D4B57E] cursor-not-allowed" />
                        </div>

                        <p className="text-xs font-bold text-stone-400 dark:text-[#666] uppercase tracking-wider mt-6 mb-2">Campos Dinámicos Detectados</p>

                        <div className="grid gap-3">
                            {availableAttributes.length > 0 ? (
                                availableAttributes.filter(key => 
                                    !['brand', 'categoria', 'category', 'atributos_dinamicos'].includes(key.toLowerCase())
                                ).map(key => (
                                    <label
                                        key={key}
                                        className={`flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer group ${selectedKeys.includes(key)
                                            ? 'bg-color-one/5 dark:bg-[#D4B57E40] border-[#D4B57E] shadow-sm'
                                            : 'bg-white dark:bg-[#121212] border-stone-100 dark:border-[#2a2a2a] hover:border-stone-200 dark:hover:border-[#3a3a3a] hover:bg-stone-50 dark:hover:bg-[#1a1a1a]'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className={`font-semibold capitalize ${selectedKeys.includes(key) ? 'text-stone-900 dark:text-white' : 'text-stone-600 dark:text-[#a0a0a0]'
                                                }`}>{key}</span>
                                        </div>
                                        <input
                                            type="checkbox"
                                            checked={selectedKeys.includes(key)}
                                            onChange={() => handleToggleKey(key)}
                                            className="w-5 h-5 accent-[#D4B57E] rounded-md transition-transform group-active:scale-95"
                                        />
                                    </label>
                                ))
                            ) : (
                                <div className="text-center py-8 text-stone-400 dark:text-[#666] italic bg-stone-50 dark:bg-[#1a1a1a] rounded-2xl border border-dashed border-stone-200 dark:border-[#2a2a2a]">
                                    No se detectaron campos adicionales en los productos
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-8 py-6 border-t border-stone-100 dark:border-[#2a2a2a] flex items-center justify-end gap-3 bg-stone-50/30 dark:bg-[#1a1a1a]/30">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 rounded-xl text-sm font-bold text-stone-500 dark:text-[#a0a0a0] hover:bg-stone-100 dark:hover:bg-[#2a2a2a] transition-colors"
                        disabled={isSaving}
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="px-8 py-2.5 rounded-xl text-sm font-bold text-white bg-[#D4B57E] hover:bg-[#C4A56E] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-[#D4B57E40] active:scale-[0.98]"
                    >
                        {isSaving ? 'Guardando...' : 'Aplicar Filtros'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FilterConfigModal;
