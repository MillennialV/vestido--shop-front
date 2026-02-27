"use client";

import React, { useEffect } from 'react';
import { useCart } from '@/context/CartContext';
import { CloseIcon } from '@/components/Icons';
import { event } from '@/lib/analytics';
import ItemCart from './ItemCart';

const CartModal: React.FC = () => {
    const { cart, removeFromCart, updateQuantity, cartTotal, isCartOpen, toggleCart } = useCart();

    const handleCheckout = () => {
        event({
            action: 'begin_checkout',
            category: 'ecommerce',
            label: `Total: S/ ${cartTotal.toFixed(2)}`,
            value: cartTotal
        });

        const itemsList = cart.map((item, index) =>
            `${index + 1}. ${item.title} - Talla: ${item.size} - Precio: S/ ${item.price}`
        ).join('\n');

        const total = `\n\nTotal a Pagar: S/ ${cartTotal.toFixed(2)}`;
        const message = `Resumen del Pedido:\n\n${itemsList}${total}`;
        alert(message);
    };

    const modalRef = React.useRef<HTMLDivElement>(null);

    // Close on escape key
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') toggleCart();
        };
        if (isCartOpen) window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isCartOpen, toggleCart]);

    // Close on outside click
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent | TouchEvent) => {
            // Wait for modal to be open and check if the click target is outside the modal ref
            if (isCartOpen && modalRef.current && !modalRef.current.contains(event.target as Node)) {
                // Ignore clicks on header buttons to prevent double-toggling
                const target = event.target as HTMLElement;
                if (!target.closest('header')) {
                    toggleCart();
                }
            }
        };

        if (isCartOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('touchstart', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
        };
    }, [isCartOpen, toggleCart]);


    if (!isCartOpen) return null;

    return (
        <div
            id="cart-modal"
            ref={modalRef}
            className="fixed top-16  xl:top-24 right-[85px] sm:right-[120px] fd:right-6 xl:right-6  2xl:right-12  w-[calc(100vw-100px)] sm:w-full max-w-[420px] z-50 pointer-events-auto"
        >
            <div className="relative w-full max-h-[calc(100vh-100px)] bg-color-four/70 dark:bg-color-three/70 backdrop-blur-lg rounded-[20px] shadow-2xl flex flex-col overflow-hidden animate-fade-in-down z-10 transition-all">

                {/* Items List */}
                <div className="flex-1 overflow-y-auto px-4 py-[12px] custom-scrollbar max-h-[calc(100vh-100px)]">
                    {cart.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-40 text-stone-400">
                            <p className="text-lg">Tu cesta está vacía</p>
                            <button
                                onClick={toggleCart}
                                className="mt-4 text-white font-medium underline opacity-80 hover:opacity-100"
                            >
                                Continuar comprando
                            </button>
                        </div>
                    ) : (
                        cart.map((item) => (
                            <ItemCart
                                key={item.id}
                                item={item}
                                updateQuantity={updateQuantity}
                                removeFromCart={removeFromCart}
                            />
                        ))
                    )}
                </div>

                {/* Footer fixed */}
                {cart.length > 0 && (
                    <div className="p-6 bg-color-four dark:bg-color-two rounded-b-[24px]">
                        <div className="flex justify-between items-center mb-6">
                            <span className="text-[20px] font-[500] text-color-three dark:text-color-four font-inter">Total:</span>
                            <span className="text-[22px] font-[600] text-color-three dark:text-color-four font-inter">
                                S/. {cartTotal.toFixed(0)}
                            </span>
                        </div>
                        <button
                            onClick={handleCheckout}
                            className="w-full bg-color-three dark:bg-color-four text-color-four dark:text-color-three py-4 rounded-[16px] text-[20px] font-[500] font-inter hover:bg-stone-200 transition-colors shadow-lg active:scale-[0.98]"
                        >
                            Comprar
                        </button>
                    </div>
                )}
            </div>
        </div>

    );
};

export default CartModal;
