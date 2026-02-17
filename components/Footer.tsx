"use client";

import React, { useState } from "react";
import Link from "next/link";
import FilterControls from "./FilterControls";
import SearchBar from "./SearchBar";
import { ChevronUpIcon, ChevronDownIcon } from "./Icons";
import { Chatbot } from "./Chatbot";

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
      className="bg-white dark:bg-stone-900 border-t border-stone-200 dark:border-stone-700 fixed bottom-0 left-0 right-0 z-40 transition-colors shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div
          id="filter-panel-content"
          className={`absolute bottom-full left-0 right-0 bg-white dark:bg-stone-900 border-t border-stone-200 dark:border-stone-700 transition-all duration-300 ease-in-out shadow-lg overflow-hidden ${isOpen ? 'max-h-[80vh] opacity-100' : 'max-h-0 opacity-0'}`}
        >
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
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

        <div className="flex justify-between items-center relative z-50 py-2">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex justify-start items-center py-2 bg-transparent group cursor-pointer gap-4"
            aria-expanded={isOpen}
            aria-controls="filter-panel-content"
          >
            <div className={`p-2 rounded-full bg-stone-100 dark:bg-stone-800 group-hover:bg-stone-200 dark:group-hover:bg-stone-700 transition-all duration-300 ${isOpen ? '' : 'rotate-180'}`}>
              <ChevronDownIcon className="w-5 h-5 text-stone-600 dark:text-stone-300" />
            </div>

            <div className="flex items-center gap-3">
              <h3 className="text-lg font-medium tracking-wide text-stone-800 dark:text-stone-100 group-hover:text-stone-600 dark:group-hover:text-stone-300 transition-colors">
                Filtros y Búsqueda
              </h3>
            </div>
          </button>

          <div className="flex-shrink-0">
            <Chatbot />
          </div>
        </div>


      </div>
    </section>
  );
};

export default Footer;
