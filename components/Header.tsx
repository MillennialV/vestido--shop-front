"use client";

import React from "react";
import { AdminIcon, ExitIcon, SunIcon, MoonIcon } from "./Icons";
import { useDarkMode } from "@/hooks/useDarkMode";

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

  return (
    <header className="py-4 border-b border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 ">

        <div className="flex flex-col md:grid md:grid-cols-3 items-center">
          <div className="hidden md:block"></div>

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
              <p className="mt-1 text-base text-stone-500 dark:text-stone-400 tracking-widest uppercase">
                by Womanity
              </p>
              <div className="mt-3 text-sm text-stone-600 dark:text-stone-500 tracking-wide">
                <p>Av. Paz Soldán 255 Sótano A24 San Isidro</p>
                <p className="mt-0.5 font-medium">(956382746)</p>
              </div>
            </a>
          </div>

          <div className="flex items-center justify-center md:justify-end gap-2 mt-4 md:mt-0">
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
