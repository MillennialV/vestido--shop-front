"use client";

import React from "react";
import { AdminIcon, ExitIcon, SunIcon, MoonIcon } from "./Icons";
import { useDarkMode } from "../hooks/useDarkMode";

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
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="absolute top-1/2 right-4 sm:right-6 lg:right-8 -translate-y-1/2 flex items-center gap-2">
            {mounted && (
              <button
                onClick={toggleDarkMode}
                onMouseDown={(e) => e.currentTarget.blur()}
                className="p-2 rounded-full text-stone-600 dark:text-white hover:bg-stone-200 dark:hover:bg-stone-700 hover:text-stone-900 dark:hover:text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-500 dark:focus-visible:ring-stone-400 active:bg-stone-200 dark:active:bg-stone-700"
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
            onMouseDown={(e) => e.currentTarget.blur()}
            className="p-2 rounded-full text-stone-600 dark:text-white hover:bg-stone-200 dark:hover:bg-stone-700 hover:text-stone-900 dark:hover:text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-500 dark:focus-visible:ring-stone-400 active:bg-stone-200 dark:active:bg-stone-700"
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

        {/* --- Content Flow Elements --- */}
        <div className="text-center pt-4 pb-2">
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
          </a>
        </div>
      </div>
    </header>
  );
};

export default Header;
