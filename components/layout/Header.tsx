"use client";

import React from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { SettingsIcon, AdminIcon, ExitIcon, SunIcon, MoonIcon, ShoppingCartIcon, SearchIcon, MinusIcon } from "@/components/ui/Icons";
import FilterModal from "@/components/catalog/FilterModal";
import { ConfigModal } from "@/components/modals/ConfigModal";
import MobileActionsMenu from "@/components/ui/MobileActionsMenu";
import { useDarkMode } from "@/hooks/useDarkMode";
import { useCart } from "@/context/CartContext";

import { useRemoteTheme } from "@/context/RemoteThemeContext";
import { useAuth } from "@/hooks/useAuth";

interface HeaderProps {
  isAdmin: boolean;
  onToggleAdmin: () => void;
  navigate: (path: string) => void;
  isFilterVisible?: boolean;
  onToggleFilters?: () => void;
  activeFilterKeys?: string[];
  filterOptions?: Record<string, string[]>;
  filters?: Record<string, string>;
  onFilterChange?: (filters: Record<string, string>) => void;
  onClearFilters?: () => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  colors?: string[];
  hideAdminControls?: boolean;
}

const Header: React.FC<HeaderProps> = ({
  isAdmin,
  onToggleAdmin,
  navigate,
  isFilterVisible,
  onToggleFilters,
  activeFilterKeys,
  filterOptions,
  filters,
  onFilterChange,
  onClearFilters,
  searchQuery,
  onSearchChange,
  colors = [],
  hideAdminControls = false,
}) => {
  const { isDark, toggleDarkMode } = useDarkMode();
  const { totalItems, toggleCart, isCartOpen } = useCart();
  const { storeInfo, organization } = useRemoteTheme();
  const [mounted, setMounted] = React.useState(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = React.useState(false);

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

  const pathname = usePathname();
  const isHome = pathname === "/" || pathname === "";

  return (

    <header className={`sticky top-0 ${isFilterVisible ? 'z-[999999]' : 'z-50'} bg-color-four dark:bg-[#0f0f0f] border-b border-color-three/10 dark:border-[#2a2a2a] shadow-sm py-[20px] transition-all duration-300`}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 ">

        <div className="flex items-center justify-between md:grid md:grid-cols-3 relative">
          {onToggleFilters && (
            <div className="md:hidden flex items-center">
              <button
                onClick={onToggleFilters}
                className="w-10 h-10 flex items-center justify-center bg-color-four dark:bg-[#1a1a1a] text-color-three dark:text-white rounded-full shadow-md hover:scale-110 active:scale-95 transition-all"
                aria-label={isFilterVisible ? "Ocultar filtros" : "Mostrar filtros"}
              >
                {isFilterVisible ? (
                  <MinusIcon className="w-6 h-6" />
                ) : (
                  <SearchIcon className="w-6 h-6" />
                )}
              </button>

              {/* Mobile Filter Modal - Attached to Header */}
              <FilterModal
                activeFilterKeys={activeFilterKeys || []}
                filterOptions={filterOptions || {}}
                filters={filters || { brand: "all" }}
                onFilterChange={onFilterChange || (() => { })}
                searchQuery={searchQuery || ""}
                onSearchChange={onSearchChange || (() => { })}
                isVisible={!!isFilterVisible}
                onClose={onToggleFilters}
                onClearAll={onClearFilters}
              />
            </div>
          )}

          <nav aria-label="Navegación principal" className="hidden md:flex items-center gap-6">
            <Link
              href="/#catalogo"
              onClick={(e) => {
                if (isHome) {
                  e.preventDefault();
                  scrollToSection('catalogo');
                }
              }}
              className="dark font-primary cursor-pointer hover:opacity-80 transition-opacity">
              Catálogo
            </Link>
            <Link
              href="/#blog"
              onClick={(e) => {
                if (isHome) {
                  e.preventDefault();
                  scrollToSection('blog');
                }
              }}
              className="dark font-primary cursor-pointer hover:opacity-80 transition-opacity">
              Blog
            </Link>
            <Link
              href="/#faq"
              onClick={(e) => {
                if (isHome) {
                  e.preventDefault();
                  scrollToSection('faq');
                }
              }}
              className="dark font-primary cursor-pointer hover:opacity-80 transition-opacity">
              Preguntas
            </Link>
          </nav>

          <div className="text-center">
            <Link
              href="/"
              className="font-header"
            >
              <span
                aria-hidden="true"
                className="text-2xl md:text-3xl tracking-[0.2em] font-medium uppercase"
              >
                {organization?.organization_display_name || organization?.organization_name}
              </span>
              {isHome ? (
                <span className="sr-only">
                  {storeInfo?.title || ""}
                </span>
              ) : (
                <span className="sr-only">
                  {storeInfo?.title || ""}
                </span>
              )}
            </Link>
          </div>

          <div className="flex items-center justify-end gap-4 md:gap-[41px]">
            {/* Desktop Icons */}
            <div className="hidden lg:flex items-center gap-4 md:gap-[41px]">
              <button
                onClick={toggleCart}
                className={`relative p-2 rounded-full transition-all duration-300 ${isCartOpen
                  ? "bg-color-background text-color-three dark:bg-[#0f0f0f] dark:text-color-four scale-[1.15] shadow-sm"
                  : "text-color-three dark:text-color-four hover:bg-color-background dark:hover:bg-[#0f0f0f] hover:scale-110"
                  }`}
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
                className="p-2 rounded-full text-color-three dark:text-color-four hover:bg-color-background dark:hover:bg-[#0f0f0f] hover:scale-110 transition-all duration-300"
                aria-label={mounted ? (isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro") : "Cambiar modo"}
              >
                {mounted ? (
                  isDark ? <SunIcon className="w-6 h-6" /> : <MoonIcon className="w-6 h-6" />
                ) : (
                  <MoonIcon className="w-6 h-6" />
                )}
              </button>

              {!hideAdminControls && isAdmin && (
                <button
                  onClick={() => setIsConfigModalOpen(true)}
                  className="p-2 rounded-full text-color-three dark:text-color-four hover:bg-color-background dark:hover:bg-[#0f0f0f] hover:scale-110 transition-all duration-300"
                  aria-label="Abrir configuración"
                >
                  <SettingsIcon className="w-6 h-6" />
                </button>
              )}

              {!hideAdminControls && (
                <button
                  onClick={onToggleAdmin}
                  className="p-2 rounded-full text-color-three dark:text-color-four hover:bg-color-background dark:hover:bg-[#0f0f0f] hover:scale-110 transition-all duration-300"
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
              )}
            </div>

            {/* Mobile Actions Menu */}
            <div className="lg:hidden">
              <MobileActionsMenu isAdmin={isAdmin} onToggleAdmin={onToggleAdmin} hideAdminControls={hideAdminControls} />
            </div>
          </div>
        </div>


      </div>
      <ConfigModal isOpen={isConfigModalOpen} onClose={() => setIsConfigModalOpen(false)} />
    </header>
  );
};

export default Header;
