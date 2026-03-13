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
    return (
        <div className="relative">
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
                <div className="absolute top-full left-0 mt-3 z-[100] min-w-[300px] bg-stone-900/95 backdrop-blur-md border border-stone-800 rounded-[24px] shadow-2xl p-6 animate-in fade-in slide-in-from-top-2 duration-200">
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
        <div className="flex flex-col gap-4">
            <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
                <input
                    type="text"
                    placeholder="Search brand"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full bg-stone-800/50 border border-stone-700 rounded-xl py-2 pl-10 pr-4 text-sm text-stone-200 placeholder:text-stone-600 focus:outline-none focus:ring-1 focus:ring-[#D4B57E]"
                />
            </div>
            <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {filteredBrands.map(brand => (
                    <label key={brand} className="flex items-center gap-3 cursor-pointer group">
                        <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                            selectedBrands.includes(brand)
                                ? "bg-[#D4B57E] border-[#D4B57E]"
                                : "border-stone-700 group-hover:border-stone-500"
                        }`}>
                            {selectedBrands.includes(brand) && <CheckCircleIcon className="w-3.5 h-3.5 text-stone-900" />}
                        </div>
                        <span className="text-sm text-stone-300 group-hover:text-white transition-colors">
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
        <div className="flex flex-wrap gap-2 max-w-[400px] max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
            {occasions.map(occasion => (
                <button
                    key={occasion}
                    onClick={() => onChange(occasion)}
                    className={`px-4 py-2 rounded-xl border text-sm transition-all flex items-center gap-2 ${
                        selectedOccasion === occasion
                            ? "bg-[#D4B57E]/10 border-[#D4B57E] text-[#D4B57E]"
                            : "bg-stone-800/30 border-stone-700 text-stone-400 hover:border-stone-500 hover:text-stone-200"
                    }`}
                >
                    {selectedOccasion === occasion && <CheckCircleIcon className="w-3.5 h-3.5" />}
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
        <div className="flex flex-col gap-6 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
            <div className="flex flex-wrap gap-3">
                {alphaSizes.map(size => (
                    <button
                        key={size}
                        onClick={() => onChange(size)}
                        className={`w-10 h-10 rounded-xl border text-sm font-medium transition-all ${
                            selectedSize === size
                                ? "bg-[#D4B57E]/10 border-[#D4B57E] text-[#D4B57E]"
                                : "bg-stone-800/30 border-stone-700 text-stone-400 hover:border-stone-500 hover:text-stone-200"
                        }`}
                    >
                        {size}
                    </button>
                ))}
            </div>

            {numericSizes.length > 0 && (
                <div className="flex flex-col gap-3">
                    <span className="text-[10px] text-stone-500 font-bold tracking-[0.1em] uppercase">Numeric Sizes</span>
                    <div className="flex flex-wrap gap-3">
                        {numericSizes.map(size => (
                            <button
                                key={size}
                                onClick={() => onChange(size)}
                                className={`w-10 h-10 rounded-xl border text-sm font-medium transition-all ${
                                    selectedSize === size
                                        ? "bg-[#D4B57E]/10 border-[#D4B57E] text-[#D4B57E]"
                                        : "bg-stone-800/30 border-stone-700 text-stone-400 hover:border-stone-500 hover:text-stone-200"
                                }`}
                            >
                                {size}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
