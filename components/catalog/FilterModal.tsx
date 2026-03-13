import React from 'react';
import { SearchIcon, ChevronDownIcon } from "@/components/ui/Icons";

interface FilterModalProps {
    brands: string[];
    sizes: string[];
    occasions: string[];
    filters: { brand: string; size: string; color: string; occasion: string; };
    onFilterChange: (filters: { brand?: string; size?: string; color?: string; occasion?: string; }) => void;
    searchQuery: string;
    onSearchChange: (query: string) => void;
    isVisible: boolean;
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
}) => {
    if (!isVisible) return null;

    const handleBrandChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        onFilterChange({ brand: e.target.value });
    };

    const handleSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        onFilterChange({ size: e.target.value });
    };

    const handleOccasionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        onFilterChange({ occasion: e.target.value });
    };

    return (
        <div className="absolute top-12 left-0 z-50 flex flex-col gap-2 p-4 bg-color-four  dark:bg-color-two rounded-2xl shadow-xl border border-stone-100 dark:border-stone-700 w-[calc(100vw-46px)] max-h-[80vh] overflow-y-auto overflow-x-hidden md:relative md:top-0 md:flex-row md:p-0 md:bg-transparent md:dark:bg-transparent md:shadow-none md:border-none md:w-auto md:max-h-none md:overflow-visible md:flex-grow flex-nowrap">
            {/* Search Bar */}
            <div className="relative w-full md:flex-grow md:max-w-[300px]">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                    <SearchIcon className="h-4 w-4 text-stone-400" />
                </div>
                <input
                    type="text"
                    placeholder="Buscar prenda..."
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="input-primary w-full rounded-full py-2 pl-11 pr-4 focus:ring-2 focus:ring-color-one transition-all placeholder:text-stone-400"
                />
            </div>

            {/* Brand Filter */}
            <div className="relative w-full md:flex-shrink-0 md:w-auto">
                <select
                    value={filters.brand}
                    onChange={handleBrandChange}
                    className="input-primary w-full appearance-none rounded-full py-2 pl-4 pr-9 focus:ring-2 focus:ring-color-one transition-all cursor-pointer md:min-w-[130px]"
                >
                    <option value="all">Todas las marcas</option>
                    {brands.map((brand) => (
                        <option key={brand} value={brand}>{brand}</option>
                    ))}
                </select>
                <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400 pointer-events-none" />
            </div>

            {/* Size Filter */}
            <div className="relative w-full md:flex-shrink-0 md:w-auto">
                <select
                    value={filters.size}
                    onChange={handleSizeChange}
                    className="input-primary w-full appearance-none rounded-full py-2 pl-4 pr-9 focus:ring-2 focus:ring-color-one transition-all cursor-pointer md:min-w-[110px]"
                >
                    <option value="all">Todas las tallas</option>
                    {sizes.map((size) => (
                        <option key={size} value={size}>{size}</option>
                    ))}
                </select>
                <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400 pointer-events-none" />
            </div>

            {/* Occasion Filter */}
            <div className="relative w-full md:flex-shrink-0 md:w-auto">
                <select
                    value={filters.occasion}
                    onChange={handleOccasionChange}
                    className="input-primary w-full appearance-none rounded-full py-2 pl-4 pr-9 focus:ring-2 focus:ring-color-one transition-all cursor-pointer md:min-w-[110px]"
                >
                    <option value="all">Todas las ocasiones</option>
                    {occasions.map((occasion) => (
                        <option key={occasion} value={occasion}>{occasion}</option>
                    ))}
                </select>
                <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400 pointer-events-none" />
            </div>
        </div>
    );
};

export default FilterModal;
