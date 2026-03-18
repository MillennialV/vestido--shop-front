import React, { useState } from 'react';
import { FilterDropdown, BrandFilterContent, OccasionFilterContent, SizeFilterContent } from "./FilterDropdown";
import { CloseIcon, SearchIcon, MinusIcon } from "@/components/ui/Icons";

interface FilterBarProps {
    brands: string[];
    sizes: string[];
    occasions: string[];
    filters: { brand: string; size: string; occasion: string; };
    onFilterChange: (filters: { brand?: string; size?: string; occasion?: string; }) => void;
    searchQuery: string;
    onSearchChange: (query: string) => void;
    isFilterVisible: boolean;
    onToggleFilters: () => void;
    onClearFilters: () => void;
    gridColumns: number;
    onGridColumnsChange: (cols: number) => void;
    totalProducts?: number;
}

const FilterBar: React.FC<FilterBarProps> = ({
    brands,
    sizes,
    occasions,
    filters,
    onFilterChange,
    searchQuery,
    onSearchChange,
    isFilterVisible,
    onToggleFilters,
    onClearFilters,
    gridColumns,
    onGridColumnsChange,
    totalProducts = 0,
}) => {
    const [openDropdown, setOpenDropdown] = useState<string | null>(null);

    const toggleDropdown = (name: string) => {
        setOpenDropdown(openDropdown === name ? null : name);
    };

    const hasFilters = filters.brand !== "all" || filters.size !== "all" || filters.occasion !== "all" || searchQuery !== "";

    const selectedFilterTags: { key: string; label: string; }[] = [];
    if (filters.brand !== "all") selectedFilterTags.push({ key: "brand", label: filters.brand });
    if (filters.size !== "all") selectedFilterTags.push({ key: "size", label: filters.size });
    if (filters.occasion !== "all") selectedFilterTags.push({ key: "occasion", label: filters.occasion });

    return (
        <div className="flex flex-col gap-4 mb-4 xl:mb-8 w-full">
            <div className="flex items-center gap-2 w-full">
                {/* Buscador de Texto (Título) - Siempre visible */}
                <div className="flex items-center bg-stone-100 dark:bg-stone-800 rounded-xl px-4 py-1.5 w-full md:w-auto md:min-w-[200px] md:max-w-[300px] gap-2 border border-transparent focus-within:border-[#D4B57E]/50 transition-all shadow-sm">
                    <SearchIcon className="w-3.5 h-3.5 text-stone-400" />
                    <input
                        type="text"
                        placeholder="Buscar producto..."
                        className="bg-transparent border-none outline-none text-[13px] text-stone-800 dark:text-stone-100 placeholder-stone-400 w-full"
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                    />
                    {searchQuery && (
                        <button onClick={() => onSearchChange("")} className="text-stone-400 hover:text-stone-600 transition-colors">
                            <CloseIcon className="w-3.5 h-3.5" />
                        </button>
                    )}
                </div>

                {/* Dropdowns Row (Solo Desktop) */}
                <div className="hidden md:flex items-center gap-6 flex-grow ">
                    <FilterDropdown
                        label="Marca"
                        isOpen={openDropdown === "marca"}
                        onToggle={() => toggleDropdown("marca")}
                        activeCount={filters.brand !== "all" ? 1 : 0}
                    >
                        <BrandFilterContent
                            brands={brands}
                            selectedBrands={filters.brand !== "all" ? [filters.brand] : []}
                            onChange={(brand) => {
                                onFilterChange({ brand: filters.brand === brand ? "all" : brand });
                                setOpenDropdown(null);
                            }}
                        />
                    </FilterDropdown>

                    <FilterDropdown
                        label="Talla"
                        isOpen={openDropdown === "size"}
                        onToggle={() => toggleDropdown("size")}
                        activeCount={filters.size !== "all" ? 1 : 0}
                    >
                        <SizeFilterContent
                            sizes={sizes}
                            selectedSize={filters.size}
                            onChange={(size) => {
                                onFilterChange({ size: filters.size === size ? "all" : size });
                                setOpenDropdown(null);
                            }}
                        />
                    </FilterDropdown>

                    <FilterDropdown
                        label="Ocasión"
                        isOpen={openDropdown === "occasion"}
                        onToggle={() => toggleDropdown("occasion")}
                        activeCount={filters.occasion !== "all" ? 1 : 0}
                    >
                        <OccasionFilterContent
                            occasions={occasions}
                            selectedOccasion={filters.occasion}
                            onChange={(occasion) => {
                                onFilterChange({ occasion: filters.occasion === occasion ? "all" : occasion });
                                setOpenDropdown(null);
                            }}
                        />
                    </FilterDropdown>
                </div>

                {/* Right side: Count and Grid */}
                <div className="hidden md:flex items-center gap-4 ml-auto">
                    <span className="text-xs text-stone-500 dark:text-stone-400 font-medium whitespace-nowrap">
                        <strong className="text-stone-800 dark:text-stone-200">{totalProducts}</strong> products
                    </span>

                    <div className="flex bg-stone-100 dark:bg-stone-800 rounded-full p-1 gap-1 shadow-sm">
                        {[2, 3, 4, 5].map((cols) => (
                            <button
                                key={cols}
                                onClick={() => onGridColumnsChange(cols)}
                                className={`w-8 h-8 flex items-center justify-center rounded-full transition-all ${gridColumns === cols
                                    ? "bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-sm"
                                    : "text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
                                    } ${cols === 4 ? "hidden lg:flex" : cols === 5 ? "hidden xl:flex" : "flex"}`}
                                aria-label={`Ver ${cols} columnas`}
                            >
                                <div className="grid gap-[1px] w-3 h-3" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
                                    {Array.from({ length: cols }).map((_, i) => (
                                        <div key={i} className="bg-current rounded-[0.5px] h-full" />
                                    ))}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Selected Tags Row (Premium Mockup Style) */}
            {hasFilters && (
                <div className="flex flex-wrap items-center gap-3 p-3 sm:p-4 bg-stone-50/50 dark:bg-[#1C1C1E]/50 border border-stone-100 dark:border-stone-800 rounded-3xl mt-2 animate-fade-in">
                    <div className="flex flex-wrap items-center gap-2 flex-grow">
                        {selectedFilterTags.map(tag => (
                            <div
                                key={tag.key}
                                className="flex items-center gap-2 bg-white dark:bg-stone-800/80 border border-stone-100 dark:border-stone-700 rounded-xl px-4 py-2 shadow-sm transition-all hover:border-[#D4B57E]/30"
                            >
                                <span className="text-xs sm:text-sm font-semibold text-stone-700 dark:text-stone-300 capitalize">{tag.label}</span>
                                <button
                                    onClick={() => onFilterChange({ [tag.key]: "all" })}
                                    className="text-stone-400 hover:text-red-500 transition-colors"
                                    aria-label={`Remove ${tag.label}`}
                                >
                                    <CloseIcon className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        ))}
                        {searchQuery && (
                            <div className="flex items-center gap-2 bg-white dark:bg-stone-800/80 border border-stone-100 dark:border-stone-700 rounded-xl px-4 py-2 shadow-sm">
                                <span className="text-xs sm:text-sm font-medium text-stone-700 dark:text-stone-300 italic">"{searchQuery}"</span>
                                <button
                                    onClick={() => onSearchChange("")}
                                    className="text-stone-400 hover:text-red-500 transition-colors"
                                >
                                    <CloseIcon className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        )}
                    </div>
                    <button
                        onClick={onClearFilters}
                        className="text-xs sm:text-sm font-bold text-[#D4B57E] hover:text-[#C4A56E] transition-colors px-2 py-1"
                    >
                        Limpiar todo
                    </button>
                </div>
            )}
        </div>
    );
};

export default FilterBar;
