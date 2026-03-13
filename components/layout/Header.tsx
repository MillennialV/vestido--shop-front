"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { SettingsIcon, AdminIcon, ExitIcon, SunIcon, MoonIcon, ShoppingCartIcon } from "@/components/ui/Icons";
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
  brands?: string[];
  sizes?: string[];
  occasions?: string[];
  filters?: { brand: string; size: string; color: string; occasion: string; };
  onFilterChange?: (filters: { brand?: string; size?: string; color?: string; occasion?: string; }) => void;
  onClearFilters?: () => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
}

const Header: React.FC<HeaderProps> = ({
  isAdmin,
  onToggleAdmin,
  navigate,
  isFilterVisible,
  onToggleFilters,
  brands,
  sizes,
  occasions,
  filters,
  onFilterChange,
  onClearFilters,
  searchQuery,
  onSearchChange,
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

    <header className={`sticky top-0 ${isFilterVisible ? 'z-[999999]' : 'z-50'} bg-color-four dark:bg-color-three border-b border-stone-100 dark:border-stone-800 shadow-sm py-[20px] transition-all duration-300`}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 ">

        {/* ===== MOBILE LAYOUT (below md) ===== */}
        <div className="flex items-center justify-between lg:hidden">
          {/* Left: Filter toggle */}
          {onToggleFilters ? (
            <button
              onClick={onToggleFilters}
              className="w-10 h-10 flex items-center justify-center bg-stone-100 dark:bg-[#1C1C1E] text-stone-900 dark:text-white rounded-full shadow-md hover:scale-110 active:scale-95 transition-all"
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
          ) : <div className="w-10" />}

          {/* Center: Logo */}
          <div className="text-center flex-1">
            <a href="/" onClick={(e) => handleLinkClick(e, "/")} className="font-header">
              <span aria-hidden="true" className="text-2xl tracking-[0.2em] font-medium uppercase">
                {organization?.organization_display_name || organization?.organization_name}
              </span>
            </a>
          </div>

          {/* Right: Mobile menu */}
          <MobileActionsMenu isAdmin={isAdmin} onToggleAdmin={onToggleAdmin} />
        </div>

        {/* ===== DESKTOP LAYOUT (md and up) ===== */}
        <div className="hidden lg:grid lg:grid-cols-3 items-center">
          {/* Left: Nav links */}
          <div className="flex items-center gap-6">
            <button onClick={() => scrollToSection('catalogo')} className="dark font-primary">Catálogo</button>
            <button onClick={() => scrollToSection('blog')} className="dark font-primary">Blog</button>
            <button onClick={() => scrollToSection('faq')} className="dark font-primary">Preguntas</button>
          </div>

          {/* Center: Logo */}
          <div className="text-center">
            <a href="/" onClick={(e) => handleLinkClick(e, "/")} className="font-header">
              <span aria-hidden="true" className="text-3xl tracking-[0.2em] font-medium uppercase">
                {organization?.organization_display_name || organization?.organization_name}
              </span>
              {isHome ? (
                <h1 className="sr-only">
                  {storeInfo?.title || "Vestidos de Fiesta Importados en Lima | Womanity Boutique San Isidro"}
                </h1>
              ) : (
                <span className="sr-only">{storeInfo?.title || "Womanity Boutique"}</span>
              )}
            </a>
          </div>

          {/* Right: Icons */}
          <div className="flex items-center justify-end gap-[41px]">
            <button
              onClick={toggleCart}
              className={`relative p-2 rounded-full transition-all duration-300 ${isCartOpen
                ? "bg-color-background text-color-three dark:bg-color-background-dark dark:text-color-four scale-[1.15] shadow-sm"
                : "text-color-three dark:text-color-four hover:bg-color-background dark:hover:bg-color-background-dark hover:scale-110"
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
              className="p-2 rounded-full text-color-three dark:text-color-four hover:bg-color-background dark:hover:bg-color-background-dark hover:scale-110 transition-all duration-300"
              aria-label={mounted ? (isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro") : "Cambiar modo"}
            >
              {mounted ? (
                isDark ? <SunIcon className="w-6 h-6" /> : <MoonIcon className="w-6 h-6" />
              ) : (
                <MoonIcon className="w-6 h-6" />
              )}
            </button>

            {isAdmin && (
              <button
                onClick={() => setIsConfigModalOpen(true)}
                className="p-2 rounded-full text-color-three dark:text-color-four hover:bg-color-background dark:hover:bg-color-background-dark hover:scale-110 transition-all duration-300"
                aria-label="Abrir configuración"
              >
                <SettingsIcon className="w-6 h-6" />
              </button>
            )}

            <button
              onClick={onToggleAdmin}
              className="p-2 rounded-full text-color-three dark:text-color-four hover:bg-color-background dark:hover:bg-color-background-dark hover:scale-110 transition-all duration-300"
              aria-label={isAdmin ? "Salir del modo administrador" : "Entrar al modo administrador"}
            >
              {isAdmin ? <ExitIcon className="w-6 h-6" /> : <AdminIcon className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Filter Modal (mobile only, attached outside layout flow) */}
        {onToggleFilters && (
          <FilterModal
            brands={brands || []}
            sizes={sizes || []}
            occasions={occasions || []}
            filters={filters || { brand: "all", size: "all", color: "all", occasion: "all" }}
            onFilterChange={onFilterChange || (() => { })}
            searchQuery={searchQuery || ""}
            onSearchChange={onSearchChange || (() => { })}
            isVisible={!!isFilterVisible}
            onClose={onToggleFilters}
            onClearAll={onClearFilters}
          />
        )}


      </div>
      <ConfigModal isOpen={isConfigModalOpen} onClose={() => setIsConfigModalOpen(false)} />
    </header>
  );
};

export default Header;
