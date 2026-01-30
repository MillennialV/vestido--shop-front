import React, { useState } from 'react';
import FilterControls from './FilterControls';
import SearchBar from './SearchBar';
import { ChevronUpIcon, ChevronDownIcon } from './Icons';

interface FooterProps {
  brands: string[];
  sizes: string[];
  colors: string[];
  filters: { brand: string; size: string; color: string; };
  onFilterChange: (filters: { brand?: string; size?: string; color?: string; }) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onClearAll: () => void;
}

const Footer: React.FC<FooterProps> = ({ brands, sizes, colors, filters, onFilterChange, searchQuery, onSearchChange, onClearAll }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <footer className={`fixed bottom-0 left-0 right-0 z-30 bg-white/90 dark:bg-stone-900/90 backdrop-blur-sm border-t border-stone-200 dark:border-stone-700 shadow-t-2xl transition-transform duration-300 ease-in-out ${isOpen ? 'translate-y-0' : 'translate-y-[calc(100%-4.5rem)]'}`}>
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <button 
                    onClick={() => setIsOpen(!isOpen)} 
                    className="w-full flex justify-between items-center h-[4.5rem]"
                    aria-expanded={isOpen}
                    aria-controls="filter-panel-content"
                >
                    <h3 className="text-lg font-semibold text-stone-800 dark:text-stone-100">Filtros y Búsqueda</h3>
                    {isOpen ? <ChevronDownIcon className="w-6 h-6 text-stone-600 dark:text-stone-400" /> : <ChevronUpIcon className="w-6 h-6 text-stone-600 dark:text-stone-400" />}
                </button>
                
                <div id="filter-panel-content">
                    <div className="pb-6 pt-2">
                        <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4">
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
                            <div className="w-full lg:w-72 flex-shrink-0">
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