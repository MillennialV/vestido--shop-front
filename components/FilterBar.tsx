import FilterModal from './FilterModal';

interface FilterBarProps {
    brands: string[];
    sizes: string[];
    filters: { brand: string; size: string; };
    onFilterChange: (filters: { brand?: string; size?: string; }) => void;
    searchQuery: string;
    onSearchChange: (query: string) => void;
    isFilterVisible: boolean;
    onToggleFilters: () => void;
    gridColumns: number;
    onGridColumnsChange: (cols: number) => void;
}

const FilterBar: React.FC<FilterBarProps> = ({
    brands,
    sizes,
    filters,
    onFilterChange,
    searchQuery,
    onSearchChange,
    isFilterVisible,
    onToggleFilters,
    gridColumns,
    onGridColumnsChange,
}) => {
    return (
        <div className="relative flex items-center gap-2 mb-0 xl:mb-8 w-full overflow-visible">
            {/* Desktop Filter Toggle */}
            <div className="hidden fd:flex items-center">
                <button
                    onClick={onToggleFilters}
                    className="w-10 h-10 flex items-center justify-center text-color-three dark:text-color-four"
                    aria-label={isFilterVisible ? "Ocultar filtros" : "Mostrar filtros"}
                >
                    {isFilterVisible ? (
                        <div className="w-4 h-[2px] bg-current" />
                    ) : (
                        <div className="relative w-4 h-4 flex items-center justify-center">
                            <div className="w-4 h-[2px] bg-current" />
                            <div className="w-[2px] h-4 bg-current absolute" />
                        </div>
                    )}
                </button>
            </div>

            {/* Inline Filters for Desktop / Hidden on Mobile here */}
            <div className="hidden fd:flex flex-grow">
                <FilterModal
                    brands={brands}
                    sizes={sizes}
                    filters={filters}
                    onFilterChange={onFilterChange}
                    searchQuery={searchQuery}
                    onSearchChange={onSearchChange}
                    isVisible={isFilterVisible}
                />
            </div>

            {/* Grid Controls (Always on right) */}
            <div className="flex bg-color-four dark:bg-color-three rounded-full p-1 shadow-sm gap-2 ml-auto flex-shrink-0 px-[12px] hidden fd:flex ">
                {[2, 3, 4, 5].map((cols) => (
                    <button
                        key={cols}
                        onClick={() => onGridColumnsChange(cols)}
                        className={`w-7 h-7 flex items-center justify-center rounded-full transition-all ${gridColumns === cols
                            ? "bg-color-one text-color-four shadow-sm"
                            : "text-color-three hover:text-color-four hover:bg-color-one dark:text-color-four"
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
    );
};

export default FilterBar;
