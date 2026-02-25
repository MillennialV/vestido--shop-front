"use client";

import React from "react";
import { AdminIcon, ExitIcon, SunIcon, MoonIcon, ShoppingCartIcon } from "./Icons";
import FilterModal from "./FilterModal";
import MobileActionsMenu from "./MobileActionsMenu";
import { useDarkMode } from "@/hooks/useDarkMode";
import { useCart } from "@/context/CartContext";

interface HeaderProps {
  isAdmin: boolean;
  onToggleAdmin: () => void;
  navigate: (path: string) => void;
  isFilterVisible: boolean;
  onToggleFilters: () => void;
  brands: string[];
  sizes: string[];
  colors: string[];
  filters: { brand: string; size: string; color: string; };
  onFilterChange: (filters: { brand?: string; size?: string; color?: string; }) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

const Header: React.FC<HeaderProps> = ({
  isAdmin,
  onToggleAdmin,
  navigate,
  isFilterVisible,
  onToggleFilters,
  brands,
  sizes,
  colors,
  filters,
  onFilterChange,
  searchQuery,
  onSearchChange,
}) => {
  const { isDark, toggleDarkMode } = useDarkMode();
  const { totalItems, toggleCart } = useCart();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const handleLinkClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    path: string,
  ) => {
    e.preventDefault();
    navigate(path);
  };

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    } else {
      window.location.href = `/#${id}`;
    }
  };

  return (
    <header className="sticky py-[25px] bg-color-four dark:bg-color-three top-0 z-30 transition-colors duration-300">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 ">

        <div className="flex items-center justify-between fd:grid fd:grid-cols-3 relative">
          {/* Mobile Filter Toggle */}
          <div className="fd:hidden flex items-center relative">
            <button
              onClick={onToggleFilters}
              className="w-[15px] h-[15px] flex items-center justify-center text-color-three dark:text-color-four"
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

            {/* Mobile Filter Modal - Attached to Header */}
            {isFilterVisible && (
              <div className="absolute top-full left-0 mt-2 z-[60]">
                <FilterModal
                  brands={brands}
                  sizes={sizes}
                  colors={colors}
                  filters={filters}
                  onFilterChange={onFilterChange}
                  searchQuery={searchQuery}
                  onSearchChange={onSearchChange}
                  isVisible={isFilterVisible}
                />
              </div>
            )}
          </div>

          <div className="hidden fd:flex items-center gap-6">
            <button
              onClick={() => scrollToSection('catalogo')}
              className="dark font-primary">
              Catálogo
            </button>
            <button onClick={() => scrollToSection('blog')}
              className="dark font-primary">
              Blog
            </button>
            <button onClick={() => scrollToSection('faq')}
              className="dark font-primary">
              Preguntas
            </button>
          </div>

          <div className="text-center">
            <a
              href="/"
              onClick={(e) => handleLinkClick(e, "/")}
              className="font-header"
            >
              <h1
                aria-label="title"
                role="heading"
                aria-level={1}
              >
                WOMANITY
              </h1>
            </a>
          </div>

          <div className="flex items-center justify-end gap-4 fd:gap-[41px]">
            {/* Desktop Icons */}
            <div className="hidden fd:flex items-center gap-4 fd:gap-[41px]">
              <button
                onClick={toggleCart}
                className="relative p-2 rounded-full text-stone-600 dark:text-white hover:bg-stone-200 dark:hover:bg-stone-700 hover:text-stone-900 dark:hover:text-white transition-colors"
                aria-label="Abrir carrito"
              >
                <ShoppingCartIcon className="w-6 h-6" />
                {mounted && totalItems > 0 && (
                  <span className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full">
                    {totalItems}
                  </span>
                )}
              </button>

              <button
                onClick={toggleDarkMode}
                className="p-2 rounded-full text-stone-600 dark:text-white hover:bg-stone-200 dark:hover:bg-stone-700 hover:text-stone-900 dark:hover:text-white transition-colors"
                aria-label={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
              >
                {isDark ? (
                  <SunIcon className="w-6 h-6" />
                ) : (
                  <MoonIcon className="w-6 h-6" />
                )}
              </button>

              <button
                onClick={onToggleAdmin}
                className="p-2 rounded-full text-stone-600 dark:text-white hover:bg-stone-200 dark:hover:bg-stone-700 hover:text-stone-900 dark:hover:text-white transition-colors"
                aria-label={
                  isAdmin
                    ? "Salir del modo administrador"
                    : "Entrar al modo administrador"
                }
              >
                {isAdmin ? (
                  <ExitIcon className="w-6 h-6" />
                ) : (
                  <AdminIcon className="w-6 h-6" />
                )}
              </button>
            </div>

            {/* Mobile Actions Menu */}
            <div className="fd:hidden">
              <MobileActionsMenu isAdmin={isAdmin} onToggleAdmin={onToggleAdmin} />
            </div>
          </div>
        </div>


      </div>
    </header>
  );
};

export default Header;
