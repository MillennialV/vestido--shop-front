import React, { useEffect, useRef } from 'react';
import { SearchIcon } from './Icons';

interface SearchBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ searchQuery, onSearchChange }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="relative w-full">
      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
        <SearchIcon className="h-5 w-5 text-stone-400 dark:text-stone-500" />
      </div>
      <input
        ref={inputRef}
        type="search"
        name="search"
        id="search"
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        className="block w-full rounded-md border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-700 py-2 pl-11 pr-4 text-stone-800 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 focus:border-stone-500 dark:focus:border-stone-500 focus:ring-stone-500 dark:focus:ring-stone-400 sm:text-sm"
        placeholder="Buscar..."
        aria-label="Buscar prendas"
      />
    </div>
  );
};

export default SearchBar;