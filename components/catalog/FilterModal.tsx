import React, { useState, useEffect } from 'react';
import { SearchIcon, ChevronDownIcon, CloseIcon, CheckCircleIcon } from "@/components/ui/Icons";
import { BrandFilterContent, SizeFilterContent, OccasionFilterContent } from "./FilterDropdown";

interface FilterModalProps {
    brands: string[];
    sizes: string[];
    occasions: string[];
    filters: { brand: string; size: string; occasion: string; };
    onFilterChange: (filters: { brand?: string; size?: string; occasion?: string; }) => void;
    searchQuery: string;
    onSearchChange: (query: string) => void;
    isVisible: boolean;
    onClose?: () => void;
    onClearAll?: () => void;
}

const FilterModal: React.FC<FilterModalProps> = ({
    brands,
    sizes,
    occasions = [],
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
                className="bg-white dark:bg-[#1C1C1E] w-full rounded-t-[32px] max-h-[92vh] flex flex-col shadow-2xl animate-slide-up relative overflow-hidden h-auto"
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
                    <div className="w-12 h-1.5 bg-stone-200 dark:bg-stone-700 rounded-full" />
                </div>

                {/* Close Button Only if needed, otherwise handle is enough */}
                <button 
                    onClick={onClose}
                    className="absolute top-6 right-6 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 z-10"
                >
                    <CloseIcon className="w-6 h-6" />
                </button>

                <div className="overflow-y-auto px-6 pt-4 pb-0 custom-scrollbar">
                    <div className="flex flex-col gap-6">
                        {/* MARCA */}
                        <div className="flex flex-col gap-3">
                            <h3 className="text-[10px] font-bold tracking-[0.2em] text-stone-400 uppercase">Marca</h3>
                            <BrandFilterContent 
                                brands={brands}
                                selectedBrands={localFilters.brand !== "all" ? [localFilters.brand] : []}
                                onChange={(brand) => setLocalFilters({...localFilters, brand: localFilters.brand === brand ? "all" : brand})}
                            />
                        </div>

                        {/* TALLA */}
                        <div className="flex flex-col gap-3">
                            <h3 className="text-[10px] font-bold tracking-[0.2em] text-stone-400 uppercase">Talla</h3>
                            <SizeFilterContent 
                                sizes={sizes}
                                selectedSize={localFilters.size}
                                onChange={(size) => setLocalFilters({...localFilters, size: localFilters.size === size ? "all" : size})}
                            />
                        </div>

                        {/* OCASIÓN */}
                        <div className="flex flex-col gap-3">
                            <h3 className="text-[10px] font-bold tracking-[0.2em] text-stone-400 uppercase">Ocasión</h3>
                            <OccasionFilterContent 
                                occasions={occasions}
                                selectedOccasion={localFilters.occasion}
                                onChange={(occasion) => setLocalFilters({...localFilters, occasion: localFilters.occasion === occasion ? "all" : occasion})}
                            />
                        </div>
                    </div>
                </div>

                {/* Footer Buttons */}
                <div className="flex-shrink-0 p-6 bg-white dark:bg-[#1C1C1E] border-t border-stone-100 dark:border-stone-800 flex items-center justify-between gap-4 z-10">
                    <button 
                        onClick={handleClear}
                        className="text-stone-500 dark:text-stone-400 font-bold px-8 py-4 hover:underline"
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
