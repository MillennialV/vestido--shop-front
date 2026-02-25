import React from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "./Icons";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const PaginationComponent: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
}) => {
  // Hide pagination if there is only one page or less
  if (totalPages <= 1) {
    return null;
  }

  // Calculate visible page range (e.g., show max 5 pages at a time)
  const getVisiblePages = () => {
    const delta = 2; // Number of pages to show on each side of current page
    const range: number[] = [];
    const rangeWithDots: (number | string)[] = [];
    let l: number | undefined;

    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 ||
        i === totalPages ||
        (i >= currentPage - delta && i <= currentPage + delta)
      ) {
        range.push(i);
      }
    }

    for (let i of range) {
      if (l !== undefined) {
        if (i - l === 2) {
          rangeWithDots.push(l + 1);
        } else if (i - l !== 1) {
          rangeWithDots.push("...");
        }
      }
      rangeWithDots.push(i);
      l = i;
    }

    return rangeWithDots;
  };

  const visiblePages = getVisiblePages();

  return (
    <nav
      aria-label="Paginación de productos"
      className="flex justify-center items-center gap-2 mt-12"
    >
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="p-2 text-color-three dark:text-color-four transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="Página anterior"
      >
        <ChevronLeftIcon className="w-5 h-5" />
      </button>

      <div className="flex items-center gap-1.5">
        {visiblePages.map((page, index) =>
          page === "..." ? (
            <span key={`dots-${index}`} className="px-2 text-color-three dark:text-color-four">
              ...
            </span>
          ) : (
            <button
              key={page}
              onClick={() => onPageChange(page as number)}
              className={`min-w-[20px] h-8 px-3 text-sm font-medium rounded-full transition-all duration-200 flex items-center justify-center ${currentPage === page
                ? "bg-color-one text-color-four shadow-sm cursor-default"
                : "bg-color-four dark:bg-color-two text-color-three dark:text-color-four border border-gray-300 hover:bg-color-one hover:text-color-four"
                }`}
              aria-current={currentPage === page ? "page" : undefined}
            >
              {page}
            </button>
          ),
        )}
      </div>

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="p-2 text-color-three dark:text-color-four transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="Página siguiente"
      >
        <ChevronRightIcon className="w-5 h-5" />
      </button>
    </nav>
  );
};

export default PaginationComponent;
