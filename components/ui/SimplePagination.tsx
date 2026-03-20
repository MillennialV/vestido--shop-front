import React from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/ui/Icons";

interface SimplePaginationProps {
    currentPage: number;
    hasNextPage: boolean;
    onPageChange: (newPage: number) => void;
}

const SimplePagination: React.FC<SimplePaginationProps> = ({ currentPage, hasNextPage, onPageChange }) => {
    if (currentPage === 1 && !hasNextPage) return null;

    return (
        <nav aria-label="Paginación del blog" className="flex justify-center items-center gap-4 mt-12">
            <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage <= 1}
                className="p-3 text-stone-600 dark:text-white bg-white dark:bg-[#1a1a1a] rounded-full border border-stone-200 dark:border-[#2a2a2a] hover:bg-stone-50 dark:hover:bg-[#2a2a2a] transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-sm"
                aria-label="Página anterior"
            >
                <ChevronLeftIcon className="w-5 h-5" />
            </button>

            <span className="text-sm font-medium text-stone-500 dark:text-[#a0a0a0]">
                Página {currentPage}
            </span>

            <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={!hasNextPage}
                className="p-3 text-stone-600 dark:text-white bg-white dark:bg-[#1a1a1a] rounded-full border border-stone-200 dark:border-[#2a2a2a] hover:bg-stone-50 dark:hover:bg-[#2a2a2a] transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-sm"
                aria-label="Página siguiente"
            >
                <ChevronRightIcon className="w-5 h-5" />
            </button>
        </nav>
    );
};

export default SimplePagination;
