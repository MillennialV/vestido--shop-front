import React from 'react';

interface FilterControlsProps {
  brands: string[];
  sizes: string[];
  colors: string[];
  filters: { brand: string; size: string; color: string; };
  onFilterChange: (filters: { brand?: string; size?: string; color?: string; }) => void;
  searchQuery: string;
  onClearAll: () => void;
}

const FilterControls: React.FC<FilterControlsProps> = ({ brands, sizes, colors, filters, onFilterChange, searchQuery, onClearAll }) => {

  const handleBrandChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFilterChange({ brand: e.target.value });
  };

  const handleSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFilterChange({ size: e.target.value });
  };

  const handleColorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFilterChange({ color: e.target.value });
  };

  const hasActiveFilters = filters.brand !== 'all' || filters.size !== 'all' || filters.color !== 'all' || searchQuery !== '';

  return (
    <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-center justify-center sm:justify-start">
      <div className="w-full sm:w-auto">
        <label htmlFor="brand-filter" className="block text-sm font-medium text-stone-600 dark:text-stone-300 mb-1">
          Marca
        </label>
        <select
          id="brand-filter"
          value={filters.brand}
          onChange={handleBrandChange}
          className="block w-full pl-3 pr-10 py-2 text-base border-stone-300 dark:border-stone-600 focus:outline-none focus:ring-stone-500 dark:focus:ring-stone-400 focus:border-stone-500 dark:focus:border-stone-500 sm:text-sm rounded-md bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100"
        >
          <option value="all">Todas las marcas</option>
          {brands.map((brand) => (
            <option key={`brand-${brand}`} value={brand}>
              {brand}
            </option>
          ))}
        </select>
      </div>

      <div className="w-full sm:w-auto">
        <label htmlFor="size-filter" className="block text-sm font-medium text-stone-600 dark:text-stone-300 mb-1">
          Talla
        </label>
        <select
          id="size-filter"
          value={filters.size}
          onChange={handleSizeChange}
          className="block w-full pl-3 pr-10 py-2 text-base border-stone-300 dark:border-stone-600 focus:outline-none focus:ring-stone-500 dark:focus:ring-stone-400 focus:border-stone-500 dark:focus:border-stone-500 sm:text-sm rounded-md bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100"
        >
          <option value="all">Todas las tallas</option>
          {sizes.map((size) => (
            <option key={`size-${size}`} value={size}>
              {size}
            </option>
          ))}
        </select>
      </div>

      <div className="w-full sm:w-auto">
        <label htmlFor="color-filter" className="block text-sm font-medium text-stone-600 dark:text-stone-300 mb-1">
          Color
        </label>
        <select
          id="color-filter"
          value={filters.color}
          onChange={handleColorChange}
          className="block w-full pl-3 pr-10 py-2 text-base border-stone-300 dark:border-stone-600 focus:outline-none focus:ring-stone-500 dark:focus:ring-stone-400 focus:border-stone-500 dark:focus:border-stone-500 sm:text-sm rounded-md bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100"
        >
          <option value="all">Todos los colores</option>
          {colors.map((color) => (
            <option key={`color-${color}`} value={color}>
              {color}
            </option>
          ))}
        </select>
      </div>
      {hasActiveFilters && (
        <div className="w-full sm:w-auto self-end sm:self-center">
          <button
            onClick={onClearAll}
            className="w-full sm:w-auto text-sm text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100 font-semibold transition-colors py-2 px-3 rounded-md hover:bg-stone-100 dark:hover:bg-stone-700"
            aria-label="Limpiar todos los filtros y búsqueda"
          >
            Limpiar
          </button>
        </div>
      )}
    </div>
  );
};

export default FilterControls;