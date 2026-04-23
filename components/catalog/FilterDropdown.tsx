"use client";

import React, { useState } from 'react';
import { SearchIcon, ChevronDownIcon, CheckCircleIcon } from "@/components/ui/Icons";

interface FilterDropdownProps {
    label: string;
    isOpen: boolean;
    onToggle: () => void;
    children: React.ReactNode;
    activeCount?: number;
}

export const FilterDropdown: React.FC<FilterDropdownProps> = ({
    label,
    isOpen,
    onToggle,
    children,
    activeCount
}) => {
    const dropdownRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent | TouchEvent) => {
            if (isOpen && dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                onToggle();
            }
        };

        const handleEscape = (e: KeyboardEvent) => {
            if (isOpen && e.key === 'Escape') {
                onToggle();
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('touchstart', handleClickOutside);
            document.addEventListener('keydown', handleEscape);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [isOpen, onToggle]);

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={onToggle}
                className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-200 text-sm font-medium border border-transparent ${
                    isOpen || (activeCount && activeCount > 0)
                        ? "bg-color-one text-color-four shadow-md"
                        : "bg-color-four dark:bg-[#0f0f0f] text-color-three dark:text-white hover:bg-color-four/80 dark:hover:bg-[#1a1a1a] dark:border-[#2a2a2a]"
                }`}
            >
                <span>{label}</span>
                <ChevronDownIcon className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 mt-3 z-[100] min-w-[300px] bg-color-four dark:bg-[#1a1a1a]/95 backdrop-blur-md border border-color-three/10 dark:border-[#2a2a2a] rounded-[24px] shadow-2xl p-6 animate-in fade-in slide-in-from-top-2 duration-200">
                    {children}
                </div>
            )}
        </div>
    );
};

// Specialized contents

export const BrandFilterContent: React.FC<{
    brands: string[];
    selectedBrands: string[];
    onChange: (brand: string) => void;
    placeholder?: string;
}> = ({ brands, selectedBrands, onChange, placeholder = "Buscar Marca..." }) => {
    const [search, setSearch] = useState("");
    const filteredBrands = brands.filter(b => b.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="flex flex-col gap-3">
            <div className="relative">
                <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <input
                    type="text"
                    placeholder={placeholder}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full bg-color-four dark:bg-[#0f0f0f] border border-color-three/10 dark:border-[#2a2a2a] rounded-2xl py-3 pl-11 pr-4 text-sm text-color-three dark:text-white placeholder:text-color-three/40 dark:placeholder-[#a0a0a0] focus:outline-none focus:ring-2 focus:ring-color-one/50 transition-all"
                />
            </div>
            <div className="flex flex-col gap-3 max-h-[180px] overflow-y-auto pr-2 custom-scrollbar">
                {filteredBrands.map(brand => (
                    <label key={brand} className="flex items-center gap-4 cursor-pointer group">
                        <div className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all ${
                            selectedBrands.includes(brand)
                                ? "bg-color-one border-color-one"
                                : "border-color-three/20 dark:border-[#2a2a2a] bg-color-four dark:bg-[#1a1a1a] group-hover:border-color-two/50"
                        }`}>
                            {selectedBrands.includes(brand) && <div className="w-2.5 h-2.5 bg-color-four rounded-sm" />}
                        </div>
                        <span className={`text-sm transition-colors ${
                            selectedBrands.includes(brand) 
                                ? "font-bold text-stone-900 dark:text-white" 
                                : "text-stone-600 dark:text-[#a0a0a0] group-hover:text-stone-900 dark:group-hover:text-white"
                        }`}>
                            {brand}
                        </span>
                        <input
                            type="checkbox"
                            className="hidden"
                            checked={selectedBrands.includes(brand)}
                            onChange={() => onChange(brand)}
                        />
                    </label>
                ))}
            </div>
        </div>
    );
};

export const OccasionFilterContent: React.FC<{
    occasions: string[];
    selectedOccasion: string;
    onChange: (occasion: string) => void;
    placeholder?: string;
}> = ({ occasions, selectedOccasion, onChange, placeholder = "Buscar..." }) => {
    const [search, setSearch] = useState("");
    const filteredOccasions = occasions.filter(o => o.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="flex flex-col gap-3">
            <div className="relative">
                <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <input
                    type="text"
                    placeholder={placeholder}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full bg-color-four dark:bg-[#0f0f0f] border border-color-three/10 dark:border-[#2a2a2a] rounded-2xl py-3 pl-11 pr-4 text-sm text-color-three dark:text-white placeholder:text-color-three/40 dark:placeholder-[#a0a0a0] focus:outline-none focus:ring-2 focus:ring-color-one/50 transition-all"
                />
            </div>
            <div className="flex flex-col gap-2 max-w-full max-h-[180px] overflow-y-auto pr-2 custom-scrollbar">
                {filteredOccasions.map(occasion => (
                    <button
                        key={occasion}
                        onClick={() => onChange(occasion)}
                        className={`w-full px-5 py-3 rounded-xl border text-sm font-medium transition-all flex justify-between items-center gap-2 text-left ${
                            selectedOccasion === occasion
                                ? "bg-color-one/10 border-color-one text-color-one"
                                : "bg-color-four dark:bg-[#0f0f0f] border-color-three/10 dark:border-[#2a2a2a] text-color-three/60 dark:text-[#a0a0a0] hover:border-color-two/50 hover:text-color-three dark:hover:text-white"
                        }`}
                    >
                        <span>{occasion}</span>
                        {selectedOccasion === occasion && <div className="w-4 h-4 flex items-center justify-center flex-shrink-0"><CheckCircleIcon className="w-full h-full" /></div>}
                    </button>
                ))}
                {filteredOccasions.length === 0 && (
                    <div className="py-4 text-center text-xs text-stone-400">
                        No se encontraron opciones
                    </div>
                )}
            </div>
        </div>
    );
};

export const SizeFilterContent: React.FC<{
    sizes: string[];
    selectedSize: string;
    onChange: (size: string) => void;
    placeholder?: string;
}> = ({ sizes, selectedSize, onChange, placeholder = "Buscar Talla..." }) => {
    const [search, setSearch] = useState("");
    const filteredSizes = sizes.filter(s => s.toLowerCase().includes(search.toLowerCase()));
    
    const alphaSizes = filteredSizes.filter(s => isNaN(Number(s)));
    const numericSizes = filteredSizes.filter(s => !isNaN(Number(s)));

    return (
        <div className="flex flex-col gap-4">
            <div className="relative">
                <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <input
                    type="text"
                    placeholder={placeholder}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full bg-color-four dark:bg-[#0f0f0f] border border-color-three/10 dark:border-[#2a2a2a] rounded-2xl py-3 pl-11 pr-4 text-sm text-color-three dark:text-white placeholder:text-color-three/40 dark:placeholder-[#a0a0a0] focus:outline-none focus:ring-2 focus:ring-color-one/50 transition-all"
                />
            </div>
            <div className="flex flex-col gap-6 max-h-[180px] overflow-y-auto pr-2 custom-scrollbar">
                {alphaSizes.length > 0 && (
                    <div className="flex flex-wrap gap-3">
                        {alphaSizes.map(size => (
                            <button
                                key={size}
                                onClick={() => onChange(size)}
                                className={`w-12 h-12 rounded-2xl border text-xs sm:text-sm font-bold transition-all ${
                                    selectedSize === size
                                        ? "bg-color-one/10 border-color-one text-color-one"
                                        : "bg-color-four dark:bg-[#0f0f0f] border-color-three/10 dark:border-[#2a2a2a] text-color-three/60 dark:text-[#a0a0a0] hover:border-color-two/50 dark:hover:text-white"
                                }`}
                            >
                                {size}
                            </button>
                        ))}
                    </div>
                )}

                {numericSizes.length > 0 && (
                    <div className="flex flex-wrap gap-3">
                        {numericSizes.map(size => (
                            <button
                                key={size}
                                onClick={() => onChange(size)}
                                className={`w-12 h-12 rounded-2xl border text-xs sm:text-sm font-bold transition-all ${
                                    selectedSize === size
                                        ? "bg-color-one/10 border-color-one text-color-one"
                                        : "bg-color-four dark:bg-[#0f0f0f] border-color-three/10 dark:border-[#2a2a2a] text-color-three/60 dark:text-[#a0a0a0] hover:border-color-two/50 dark:hover:text-white"
                                }`}
                            >
                                {size}
                            </button>
                        ))}
                    </div>
                )}

                {filteredSizes.length === 0 && (
                    <div className="py-4 text-center text-xs text-stone-400">
                        No se encontraron opciones
                    </div>
                )}
            </div>
        </div>
    );
};
