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
    <footer
      className={`fixed bottom-0 left-0 right-0 z-50 
        bg-white/80 dark:bg-stone-900/80 
        backdrop-blur-xl border-t border-stone-200/50 dark:border-stone-700/50 
        shadow-[0_-4px_20px_rgba(0,0,0,0.05)] dark:shadow-[0_-4px_20px_rgba(0,0,0,0.2)]
        transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1)
        ${isOpen ? "translate-y-0" : "translate-y-[calc(100%-4.5rem)]"}`}
      style={{ pointerEvents: "auto" }}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex justify-between items-center h-[4.5rem] bg-transparent group cursor-pointer"
          aria-expanded={isOpen}
          aria-controls="filter-panel-content"
        >
          <div className="flex items-center gap-3">
            <span className={`w-8 h-1 rounded-full bg-stone-300 dark:bg-stone-600 absolute left-1/2 -translate-x-1/2 top-3 transition-opacity duration-300 ${isOpen ? 'opacity-0' : 'opacity-100'}`} />
            <h3 className="text-lg font-medium tracking-wide text-stone-800 dark:text-stone-100 group-hover:text-stone-600 dark:group-hover:text-stone-300 transition-colors">
              Filtros y Búsqueda
            </h3>
          </div>
          <div className={`p-2 rounded-full bg-stone-100 dark:bg-stone-800 group-hover:bg-stone-200 dark:group-hover:bg-stone-700 transition-all duration-300 ${isOpen ? 'rotate-180' : ''}`}>
            <ChevronUpIcon className="w-5 h-5 text-stone-600 dark:text-stone-300" />
          </div>
        </button>

        <div
          id="filter-panel-content"
          className={`transition-all duration-500 ease-in-out ${isOpen ? 'opacity-100 max-h-[80vh] visible' : 'opacity-0 max-h-0 invisible'}`}
        >
          <div className="pb-8 pt-2 space-y-6">
            <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6">
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
      </div>
    </footer>
  );
};

export default Footer;
