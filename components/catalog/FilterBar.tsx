import React, { useState } from 'react';
import { FilterDropdown, BrandFilterContent, OccasionFilterContent, SizeFilterContent } from "./FilterDropdown";
import { CloseIcon, SearchIcon, MinusIcon, PlusIcon } from "@/components/ui/Icons";

interface FilterBarProps {
    activeFilterKeys: string[];
    filterOptions: Record<string, string[]>;
    filters: Record<string, string>;
    onFilterChange: (filters: Record<string, string>) => void;
    searchQuery: string;
    onSearchChange: (query: string) => void;
    isFilterVisible: boolean;
    onToggleFilters: () => void;
    onClearFilters: () => void;
    gridColumns: number;
    onGridColumnsChange: (cols: number) => void;
    totalProducts?: number;
    isAdmin?: boolean;
    onOpenConfig?: () => void;
    isLoading?: boolean;
}

const FilterBar: React.FC<FilterBarProps> = ({
    activeFilterKeys,
    filterOptions,
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
    isAdmin = false,
    onOpenConfig,
    isLoading = false,
}) => {
    const [openDropdown, setOpenDropdown] = useState<string | null>(null);

    const toggleDropdown = (name: string) => {
        setOpenDropdown(openDropdown === name ? null : name);
    };

    const activeFiltersCount = Object.entries(filters).filter(([key, val]) => val !== "all").length;
    const hasFilters = activeFiltersCount > 0 || searchQuery !== "";

    const selectedFilterTags = Object.entries(filters)
        .filter(([_, val]) => val !== "all")
        .map(([key, val]) => ({ key, label: val }));

    return (
        <div className="flex flex-col gap-4 mb-4 xl:mb-8 w-full">
            <div className="flex items-center gap-2 w-full">
                {/* Buscador de Texto (Título) - Siempre visible */}
                <div className="flex items-center bg-color-four dark:bg-[#0f0f0f] rounded-xl px-4 py-1.5 w-full md:w-auto md:min-w-[200px] md:max-w-[300px] gap-2 border border-color-three/10 dark:border-[#2a2a2a] focus-within:border-color-one transition-all shadow-sm">
                    <SearchIcon className="w-3.5 h-3.5 text-stone-400 dark:text-[#a0a0a0]" />
                    <input
                        type="text"
                        placeholder="Buscar producto..."
                        className="bg-transparent border-none outline-none text-[13px] text-color-three dark:text-white placeholder-color-three/40 dark:placeholder-[#a0a0a0] w-full"
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                    />
                    {searchQuery && (
                        <button onClick={() => onSearchChange("")} className="text-stone-400 hover:text-stone-600 transition-colors">
                            <CloseIcon className="w-3.5 h-3.5" />
                        </button>
                    )}
                </div>

                {/* Dropdowns Row (Dinámico) */}
                <div className="hidden md:flex flex-wrap items-center gap-3 py-1 relative">
                    {activeFilterKeys.map((key) => {
                        const rawLabel = key.charAt(0).toUpperCase() + key.slice(1);
                        const translatedLabel = 
                            key === 'brand' ? 'Marca' : 
                            key === 'size' ? 'Talla' : 
                            key === 'occasion' ? 'Ocasión' : 
                            rawLabel;
                            
                        const options = filterOptions[key] || [];
                        const currentValue = filters[key] || "all";

                        return (
                            <FilterDropdown
                                key={key}
                                label={translatedLabel}
                                isOpen={openDropdown === key}
                                onToggle={() => toggleDropdown(key)}
                                activeCount={currentValue !== "all" ? 1 : 0}
                            >
                                {key === 'brand' ? (
                                    <BrandFilterContent
                                        brands={options}
                                        selectedBrands={currentValue !== "all" ? [currentValue] : []}
                                        onChange={(brand) => {
                                            onFilterChange({ [key]: currentValue === brand ? "all" : brand });
                                            setOpenDropdown(null);
                                        }}
                                        placeholder={`Buscar ${translatedLabel}...`}
                                    />
                                ) : key === 'size' ? (
                                    <SizeFilterContent
                                        sizes={options}
                                        selectedSize={currentValue}
                                        onChange={(size) => {
                                            onFilterChange({ [key]: currentValue === size ? "all" : size });
                                            setOpenDropdown(null);
                                        }}
                                        placeholder={`Buscar ${translatedLabel}...`}
                                    />
                                ) : (
                                    <OccasionFilterContent
                                        occasions={options}
                                        selectedOccasion={currentValue}
                                        onChange={(val) => {
                                            onFilterChange({ [key]: currentValue === val ? "all" : val });
                                            setOpenDropdown(null);
                                        }}
                                        placeholder={`Buscar ${translatedLabel}...`}
                                    />
                                )}
                            </FilterDropdown>
                        );
                    })}

                    {/* Botón de Configuración (Solo Admin) */}
                    {isAdmin && (
                        <button
                            onClick={onOpenConfig}
                            className="flex items-center justify-center w-9 h-9 rounded-full bg-stone-100 dark:bg-[#1a1a1a] text-stone-400 hover:text-[#D4B57E] hover:bg-stone-200 dark:hover:bg-[#2a2a2a] transition-all border border-dashed border-stone-300 dark:border-[#3a3a3a] group"
                            title="Configurar Filtros"
                        >
                            <PlusIcon className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
                        </button>
                    )}
                </div>

                {/* Right side: Count and Grid */}
                <div className="hidden md:flex items-center gap-4 ml-auto">
                    <span className="text-xs text-stone-500 dark:text-[#a0a0a0] font-medium whitespace-nowrap">
                        <strong className="text-stone-800 dark:text-white">{totalProducts}</strong> products
                    </span>

                    <div className="flex bg-color-four dark:bg-[#1a1a1a] border border-color-three/10 dark:border-[#2a2a2a] rounded-full p-1 gap-1 shadow-sm">
                        {[2, 3, 4, 5].map((cols) => (
                            <button
                                key={cols}
                                onClick={() => !isLoading && onGridColumnsChange(cols)}
                                disabled={isLoading}
                                className={`w-8 h-8 flex items-center justify-center rounded-full transition-all ${gridColumns === cols
                                    ? "bg-color-three dark:bg-[#2a2a2a] text-color-four dark:text-white shadow-sm"
                                    : "text-stone-400 hover:text-stone-600 dark:text-[#a0a0a0] dark:hover:text-white"
                                    } ${cols === 4 ? "hidden lg:flex" : cols === 5 ? "hidden xl:flex" : "flex"} ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
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
                <div className="flex flex-wrap items-center gap-3 p-3 sm:p-4 bg-color-four/50 dark:bg-[#1a1a1a]/50 border border-color-three/10 dark:border-[#2a2a2a] rounded-3xl mt-2 animate-fade-in">
                    <div className="flex flex-wrap items-center gap-2 flex-grow">
                        {selectedFilterTags.map(tag => (
                            <div
                                key={tag.key}
                                className="flex items-center gap-2 bg-color-four dark:bg-[#2a2a2a]/80 border border-stone-100 dark:border-[#2a2a2a] rounded-xl px-4 py-2 shadow-sm transition-all hover:border-[#D4B57E]/30"
                            >
                                <span className="text-xs sm:text-sm font-semibold text-stone-700 dark:text-white capitalize">{tag.label}</span>
                                <button
                                    onClick={() => onFilterChange({ [tag.key]: "all" })}
                                    className="text-stone-400 dark:text-[#a0a0a0] hover:text-red-500 dark:hover:text-red-400 transition-colors"
                                    aria-label={`Remove ${tag.label}`}
                                >
                                    <CloseIcon className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        ))}
                        {searchQuery && (
                            <div className="flex items-center gap-2 bg-color-four dark:bg-[#2a2a2a]/80 border border-stone-100 dark:border-[#2a2a2a] rounded-xl px-4 py-2 shadow-sm">
                                <span className="text-xs sm:text-sm font-medium text-stone-700 dark:text-white italic">"{searchQuery}"</span>
                                <button
                                    onClick={() => onSearchChange("")}
                                    className="text-stone-400 dark:text-[#a0a0a0] hover:text-red-500 dark:hover:text-red-400 transition-colors"
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
