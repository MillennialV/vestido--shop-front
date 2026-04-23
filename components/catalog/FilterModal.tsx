import React, { useState, useEffect } from 'react';
import { SearchIcon, ChevronDownIcon, CloseIcon, CheckCircleIcon } from "@/components/ui/Icons";
import { BrandFilterContent, SizeFilterContent, OccasionFilterContent } from "./FilterDropdown";

interface FilterModalProps {
    activeFilterKeys: string[];
    filterOptions: Record<string, string[]>;
    filters: Record<string, string>;
    onFilterChange: (filters: Record<string, string>) => void;
    searchQuery: string;
    onSearchChange: (query: string) => void;
    isVisible: boolean;
    onClose?: () => void;
    onClearAll?: () => void;
}

const FilterModal: React.FC<FilterModalProps> = ({
    activeFilterKeys,
    filterOptions,
    filters,
    onFilterChange,
    searchQuery,
    onSearchChange,
    isVisible,
    onClose,
    onClearAll,
}) => {
    // Local state for filters to apply only when clicking "Aplicar"
    const [localFilters, setLocalFilters] = useState(filters);
    const [dragOffset, setDragOffset] = useState(0);
    const touchStartY = React.useRef(0);

    const handleTouchStart = (e: React.TouchEvent) => {
        touchStartY.current = e.touches[0].clientY;
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        const currentY = e.touches[0].clientY;
        const offset = currentY - touchStartY.current;
        if (offset > 0) {
            setDragOffset(offset);
        }
    };

    const handleTouchEnd = () => {
        if (dragOffset > 80) { // Threshold for close on drag
            if (onClose) onClose();
        }
        setDragOffset(0);
    };

    useEffect(() => {
        if (isVisible) {
            setLocalFilters(filters);
            // Only hide scroll on mobile/tablet (less than md: 768px)
            if (window.innerWidth < 768) {
                document.body.style.overflow = 'hidden';
            }
        } else {
            document.body.style.overflow = 'auto';
        }
        return () => { document.body.style.overflow = 'auto'; };
    }, [isVisible, filters]);

    if (!isVisible) return null;

    const handleApply = () => {
        onFilterChange(localFilters);
        if (onClose) onClose();
    };

    const handleClear = () => {
        const cleared = { brand: "all", size: "all", color: "all", occasion: "all" };
        setLocalFilters(cleared);
        if (onClearAll) onClearAll();
    };

    return (
        <div className="fixed inset-0 z-[999999] flex items-end justify-center bg-black/60 backdrop-blur-sm md:hidden animate-fade-in">
            <div 
                onTouchEnd={handleTouchEnd}
                className="bg-white dark:bg-[#1a1a1a] w-full rounded-t-[32px] max-h-[92vh] flex flex-col shadow-2xl animate-slide-up relative overflow-hidden h-auto"
                style={{ 
                    transform: dragOffset > 0 ? `translateY(${dragOffset}px)` : undefined, 
                    transition: dragOffset > 0 ? 'none' : dragOffset === 0 ? 'transform 0.2s ease-out' : undefined 
                }}
            >
                {/* Header Handle */}
                <div 
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                    className="w-full flex justify-center py-4 flex-shrink-0 cursor-grab active:cursor-grabbing"
                >
                    <div className="w-12 h-1.5 bg-stone-200 dark:bg-[#2a2a2a] rounded-full" />
                </div>

                {/* Close Button Only if needed, otherwise handle is enough */}
                <button 
                    onClick={onClose}
                    className="absolute top-6 right-6 text-stone-400 hover:text-stone-600 dark:text-[#a0a0a0] dark:hover:text-white z-10"
                >
                    <CloseIcon className="w-6 h-6" />
                </button>

                <div className="overflow-y-auto px-6 pt-4 pb-0 custom-scrollbar">
                    <div className="flex flex-col gap-8">
                        {activeFilterKeys.map(key => {
                            const label = key.charAt(0).toUpperCase() + key.slice(1);
                            const options = filterOptions[key] || [];
                            const currentValue = localFilters[key] || "all";

                            return (
                                <div key={key} className="flex flex-col gap-4">
                                    <h3 className="text-[10px] font-bold tracking-[0.2em] text-stone-400 dark:text-[#a0a0a0] uppercase">
                                        {label === 'Brand' ? 'Marca' : label}
                                    </h3>
                                    
                                    {key === 'brand' ? (
                                        <BrandFilterContent 
                                            brands={options}
                                            selectedBrands={currentValue !== "all" ? [currentValue] : []}
                                            onChange={(brand) => setLocalFilters({
                                                ...localFilters, 
                                                [key]: currentValue === brand ? "all" : brand
                                            })}
                                        />
                                    ) : key === 'size' ? (
                                        <SizeFilterContent 
                                            sizes={options}
                                            selectedSize={currentValue}
                                            onChange={(size) => setLocalFilters({
                                                ...localFilters, 
                                                [key]: currentValue === size ? "all" : size
                                            })}
                                        />
                                    ) : (
                                        <OccasionFilterContent 
                                            occasions={options}
                                            selectedOccasion={currentValue}
                                            onChange={(val) => setLocalFilters({
                                                ...localFilters, 
                                                [key]: currentValue === val ? "all" : val
                                            })}
                                        />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Footer Buttons */}
                <div className="flex-shrink-0 p-6 bg-white dark:bg-[#1a1a1a] border-t border-stone-100 dark:border-[#2a2a2a] flex items-center justify-between gap-4 z-10">
                    <button 
                        onClick={handleClear}
                        className="text-color-two opacity-80 hover:opacity-100 font-bold px-8 py-4 hover:underline transition-opacity"
                    >
                        Limpiar
                    </button>
                    <button 
                        onClick={handleApply}
                        className="flex-grow bg-[#D4B57E] hover:bg-[#C4A56E] text-white font-bold py-5 rounded-2xl shadow-lg transition-all active:scale-95"
                    >
                        Aplicar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FilterModal;
