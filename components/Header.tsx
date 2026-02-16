"use client";

import React from "react";
import { AdminIcon, ExitIcon, SunIcon, MoonIcon, ShoppingCartIcon } from "./Icons";
import { useDarkMode } from "@/hooks/useDarkMode";
import { useCart } from "@/context/CartContext";

interface HeaderProps {
  isAdmin: boolean;
  onToggleAdmin: () => void;
  navigate: (path: string) => void;
}

const Header: React.FC<HeaderProps> = ({
  isAdmin,
  onToggleAdmin,
  navigate,
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
    }
  };

  return (
    <header className="py-4 border-b border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900  top-0 z-30 transition-colors duration-300">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 ">

        <div className="flex flex-col md:grid md:grid-cols-3 items-center">
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-stone-600 dark:text-stone-400">
            <button onClick={() => scrollToSection('catalogo')} className="hover:text-stone-900 dark:hover:text-stone-200 transition-colors">
              Catálogo
            </button>
            <button onClick={() => scrollToSection('blog')} className="hover:text-stone-900 dark:hover:text-stone-200 transition-colors">
              Blog
            </button>
            <button onClick={() => scrollToSection('faq')} className="hover:text-stone-900 dark:hover:text-stone-200 transition-colors">
              Preguntas
            </button>
          </div>

          <div className="text-center">
            <a
              href="/"
              onClick={(e) => handleLinkClick(e, "/")}
              className="text-stone-900 dark:text-stone-100 hover:text-stone-700 dark:hover:text-stone-300 transition-colors"
            >
              <h1
                className="text-3xl md:text-4xl font-semibold tracking-wider"
                aria-label="title"
                role="heading"
                aria-level={1}
              >
                Vestidos de Fiesta
              </h1>
              <div className="mt-3 text-sm text-stone-600 dark:text-stone-500 tracking-wide">
                <p>Av. Paz Soldán 255 Sótano A24 San Isidro</p>
              </div>
            </a>
          </div>

          <div className="flex items-center justify-center md:justify-end gap-2 mt-4 md:mt-0">
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

            {mounted && (
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
            )}

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
        </div>


      </div>
    </header>
  );
};

export default Header;
