"use client";

import React, { useState } from "react";
import FilterControls from "./FilterControls";
import SearchBar from "./SearchBar";
import { ChevronUpIcon, ChevronDownIcon } from "./Icons";

interface FooterProps {
  brands: string[];
  sizes: string[];
  colors: string[];
  filters: { brand: string; size: string; color: string };
  onFilterChange: (filters: {
    brand?: string;
    size?: string;
    color?: string;
  }) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onClearAll: () => void;
}

const Footer: React.FC<FooterProps> = ({
  brands,
  sizes,
  colors,
  filters,
  onFilterChange,
  searchQuery,
  onSearchChange,
  onClearAll,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <section
      className="bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-700 sticky top-0 z-40 transition-colors"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex justify-between items-center py-4 bg-transparent group cursor-pointer"
          aria-expanded={isOpen}
          aria-controls="filter-panel-content"
        >
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-medium tracking-wide text-stone-800 dark:text-stone-100 group-hover:text-stone-600 dark:group-hover:text-stone-300 transition-colors">
              Filtros y Búsqueda
            </h3>
            {/* Indicator to show current active filters count or dot could go here */}
          </div>
          <div className={`p-2 rounded-full bg-stone-100 dark:bg-stone-800 group-hover:bg-stone-200 dark:group-hover:bg-stone-700 transition-all duration-300 ${isOpen ? 'rotate-180' : ''}`}>
            {/* Use ChevronDown as default state is closed, click to open down */}
            <ChevronDownIcon className="w-5 h-5 text-stone-600 dark:text-stone-300" />
          </div>
        </button>

        <div
          id="filter-panel-content"
          className={`transition-all duration-300 ease-in-out overflow-hidden ${isOpen ? 'max-h-[80vh] opacity-100 mb-6' : 'max-h-0 opacity-0 mb-0'}`}
        >
          <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6 pb-2">
            <div className="w-full lg:w-auto flex-grow">
              <FilterControls
                brands={brands}
                sizes={sizes}
                colors={colors}
                filters={filters}
                onFilterChange={onFilterChange}
                searchQuery={searchQuery}
                onClearAll={onClearAll}
              />
            </div>
            <div className="w-full lg:w-80 flex-shrink-0">
              <SearchBar
                searchQuery={searchQuery}
                onSearchChange={onSearchChange}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Footer;
