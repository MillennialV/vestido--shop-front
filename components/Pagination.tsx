import React from 'react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) {
    return null;
  }

  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <nav aria-label="Paginación de productos" className="flex justify-center items-center gap-2 mt-12">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="px-4 py-2 text-sm font-medium text-stone-600 dark:text-stone-200 bg-white dark:bg-stone-800 rounded-md border border-stone-300 dark:border-stone-600 hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="Página anterior"
      >
        Anterior
      </button>

      <div className="flex items-center gap-2">
        {pageNumbers.map(number => (
          <button
            key={number}
            onClick={() => onPageChange(number)}
            className={`px-4 py-2 text-sm font-medium rounded-md border transition-colors ${
              currentPage === number
                ? 'bg-stone-800 dark:bg-stone-700 text-white border-stone-800 dark:border-stone-700 cursor-default'
                : 'bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-200 border-stone-300 dark:border-stone-600 hover:bg-stone-100 dark:hover:bg-stone-700'
            }`}
            aria-current={currentPage === number ? 'page' : undefined}
          >
            {number}
          </button>
        ))}
      </div>

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="px-4 py-2 text-sm font-medium text-stone-600 dark:text-stone-200 bg-white dark:bg-stone-800 rounded-md border border-stone-300 dark:border-stone-600 hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="Página siguiente"
      >
        Siguiente
      </button>
    </nav>
  );
};

export default Pagination;