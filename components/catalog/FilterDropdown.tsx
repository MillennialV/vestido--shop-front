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
                className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-200 text-sm font-medium ${
                    isOpen || (activeCount && activeCount > 0)
                        ? "bg-[#D4B57E] text-stone-900 shadow-md"
                        : "bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700"
                }`}
            >
                <span>{label}</span>
                <ChevronDownIcon className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 mt-3 z-[100] min-w-[300px] bg-white dark:bg-stone-900/95 backdrop-blur-md border border-stone-100 dark:border-stone-800 rounded-[24px] shadow-2xl p-6 animate-in fade-in slide-in-from-top-2 duration-200">
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
}> = ({ brands, selectedBrands, onChange }) => {
    const [search, setSearch] = useState("");
    const filteredBrands = brands.filter(b => b.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="flex flex-col gap-3">
            <div className="relative">
                <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <input
                    type="text"
                    placeholder="Buscar Marca"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full bg-stone-50 dark:bg-stone-900 border border-stone-100 dark:border-stone-800 rounded-2xl py-3 pl-11 pr-4 text-sm text-stone-800 dark:text-stone-200 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#D4B57E]/50 transition-all"
                />
            </div>
            <div className="flex flex-col gap-3 max-h-[180px] overflow-y-auto pr-2 custom-scrollbar">
                {filteredBrands.map(brand => (
                    <label key={brand} className="flex items-center gap-4 cursor-pointer group">
                        <div className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all ${
                            selectedBrands.includes(brand)
                                ? "bg-[#D4B57E] border-[#D4B57E]"
                                : "border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 group-hover:border-[#D4B57E]/50"
                        }`}>
                            {selectedBrands.includes(brand) && <div className="w-2.5 h-2.5 bg-white rounded-sm" />}
                        </div>
                        <span className={`text-sm transition-colors ${
                            selectedBrands.includes(brand) 
                                ? "font-bold text-stone-900 dark:text-white" 
                                : "text-stone-600 dark:text-stone-400 group-hover:text-stone-900 dark:group-hover:text-stone-200"
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
}> = ({ occasions, selectedOccasion, onChange }) => {
    return (
        <div className="flex flex-wrap gap-3 max-w-full max-h-[160px] overflow-y-auto pr-2 custom-scrollbar">
            {occasions.map(occasion => (
                <button
                    key={occasion}
                    onClick={() => onChange(occasion)}
                    className={`px-5 py-3 rounded-2xl border text-sm font-medium transition-all flex items-center gap-2 ${
                        selectedOccasion === occasion
                            ? "bg-[#D4B57E]/10 border-[#D4B57E] text-[#D3A24D]"
                            : "bg-stone-50 dark:bg-stone-800/50 border-stone-100 dark:border-stone-700 text-stone-600 dark:text-stone-400 hover:border-[#D4B57E]/30 hover:text-stone-900 dark:hover:text-stone-200"
                    }`}
                >
                    {selectedOccasion === occasion && <div className="w-4 h-4 flex items-center justify-center"><CheckCircleIcon className="w-full h-full" /></div>}
                    <span>{occasion}</span>
                </button>
            ))}
        </div>
    );
};

export const SizeFilterContent: React.FC<{
    sizes: string[];
    selectedSize: string;
    onChange: (size: string) => void;
}> = ({ sizes, selectedSize, onChange }) => {
    const alphaSizes = sizes.filter(s => isNaN(Number(s)));
    const numericSizes = sizes.filter(s => !isNaN(Number(s)));

    return (
        <div className="flex flex-col gap-6 max-h-[180px] overflow-y-auto pr-2 custom-scrollbar">
            <div className="flex flex-wrap gap-3">
                {alphaSizes.map(size => (
                    <button
                        key={size}
                        onClick={() => onChange(size)}
                        className={`w-12 h-12 rounded-2xl border text-xs sm:text-sm font-bold transition-all ${
                            selectedSize === size
                                ? "bg-[#D4B57E]/10 border-[#D4B57E] text-[#D3A24D]"
                                : "bg-stone-50 dark:bg-stone-800/50 border-stone-100 dark:border-stone-700 text-stone-600 dark:text-stone-400 hover:border-[#D4B57E]/30"
                        }`}
                    >
                        {size}
                    </button>
                ))}
            </div>

            {numericSizes.length > 0 && (
                <div className="flex flex-wrap gap-3">
                    {numericSizes.map(size => (
                        <button
                            key={size}
                            onClick={() => onChange(size)}
                            className={`w-12 h-12 rounded-2xl border text-xs sm:text-sm font-bold transition-all ${
                                selectedSize === size
                                    ? "bg-[#D4B57E]/10 border-[#D4B57E] text-[#D3A24D]"
                                    : "bg-stone-50 dark:bg-stone-800/50 border-stone-100 dark:border-stone-700 text-stone-600 dark:text-stone-400"
                            }`}
                        >
                            {size}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};
