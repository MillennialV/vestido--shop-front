"use client";

import React, { useState } from 'react';
import { ShoppingCartIcon, SunIcon, MoonIcon, AdminIcon, ExitIcon } from './Icons';
import { useDarkMode } from '@/hooks/useDarkMode';
import { useCart } from '@/context/CartContext';

interface MobileActionsMenuProps {
    isAdmin: boolean;
    onToggleAdmin: () => void;
}

const MobileActionsMenu: React.FC<MobileActionsMenuProps> = ({ isAdmin, onToggleAdmin }) => {
    const [isOpen, setIsOpen] = useState(false);
    const { isDark, toggleDarkMode } = useDarkMode();
    const { totalItems, toggleCart } = useCart();

    return (
        <div className="relative flex flex-col items-center">
            {/* Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-[15px] h-[15px] flex flex-col items-center justify-center gap-[4px] hover:bg-color-button-icon rounded-full transition-all active:scale-95 z-50"
                aria-label="Abrir menú de acciones"
            >
                <div className="w-[15px] h-[2.5px] bg-color-three dark:bg-color-four"></div>
                <div className="w-[15px] h-[2.5px] bg-color-three dark:bg-color-four"></div>
            </button>

            {/* Glassy Actions Bar */}
            <div className={`w-[55px] absolute top-full right-0 mt-2 flex flex-col items-center gap-6 p-4 bg-color-four/70 dark:bg-color-three/70 rounded-[15px] shadow-lg  transition-all duration-300 transform origin-top ${isOpen ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 -translate-y-4 pointer-events-none"}`}>

                {/* Cart Action */}
                <button
                    onClick={() => {
                        toggleCart();
                        setIsOpen(false);
                    }}
                    className="relative p-2 text-color-three dark:text-color-four hover:scale-110 transition-transform"
                    aria-label="Cesta"
                >
                    <ShoppingCartIcon className="size-[24px]" />
                    {totalItems > 0 && (
                        <span className="absolute -top-1 -right-1 bg-color-one text-color-three dark:text-color-four text-[10px] w-4 h-4 flex items-center justify-center rounded-full font-bold">
                            {totalItems}
                        </span>
                    )}
                </button>

                {/* Theme Toggle Action */}
                <button
                    onClick={toggleDarkMode}
                    className="p-2 text-color-three dark:text-color-four hover:scale-110 transition-transform"
                    aria-label="Cambiar tema"
                >
                    {isDark ? <SunIcon className="size-[24px]" /> : <MoonIcon className="size-[24px]" />}
                </button>

                {/* Profile/Admin Action */}
                <button
                    onClick={() => {
                        onToggleAdmin();
                        setIsOpen(false);
                    }}
                    className="p-2 text-color-three dark:text-color-four hover:scale-110 transition-transform"
                    aria-label={isAdmin ? "Cerrar sesión" : "Modo administrador"}
                >
                    {isAdmin ? <ExitIcon className="size-[24px]" /> : <AdminIcon className="size-[24px]" />}
                </button>
            </div>
        </div>
    );
};

export default MobileActionsMenu;
