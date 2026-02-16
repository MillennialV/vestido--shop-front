"use client";

import React from 'react';
import { useCart } from '@/context/CartContext';
import { CloseIcon, MinusIcon, PlusIcon } from '@/components/Icons';
import Image from 'next/image';

const isExternalVideo = (url: string) => {
    if (!url) return false;
    return (
        url.includes("youtube.com") ||
        url.includes("youtu.be") ||
        url.includes("vimeo.com")
    );
};

const CartItemThumbnail = ({ item }: { item: any }) => {
    if (item.imagen_principal) {
        return (
            <Image
                src={item.imagen_principal}
                alt={item.title}
                fill
                className="object-cover"
            />
        );
    }
    if (item.videoUrl && !isExternalVideo(item.videoUrl)) {
        return (
            <video
                src={`${item.videoUrl}#t=0.1`}
                className="w-full h-full object-cover"
                muted
                preload="metadata"
                playsInline
                onMouseOver={(e) => e.currentTarget.play()}
                onMouseOut={(e) => {
                    e.currentTarget.pause();
                    e.currentTarget.currentTime = 0;
                }}
            />
        );
    }
    return <div className="w-full h-full bg-stone-200 flex items-center justify-center text-stone-400 text-xs text-center p-1">Sin imagen</div>;
};

const CartDrawer: React.FC = () => {
    const { cart, removeFromCart, updateQuantity, cartTotal, isCartOpen, toggleCart } = useCart();

    const handleCheckout = () => {
        // Generate message for alert
        const itemsList = cart.map((item, index) =>
            `${index + 1}. ${item.title} - Talla: ${item.size} - Precio: S/ ${item.price}`
        ).join('\n');

        const total = `\n\nTotal a Pagar: S/ ${cartTotal.toFixed(2)}`;

        const message = `Resumen del Pedido:\n\n${itemsList}${total}`;

        alert(message);
    };

    return (
        <>
            {/* Backdrop */}
            <div
                className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ${isCartOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={toggleCart}
            />

            {/* Drawer */}
            <div
                className={`fixed top-0 right-0 h-full w-full max-w-md bg-white dark:bg-stone-900 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${isCartOpen ? 'translate-x-0' : 'translate-x-full'}`}
            >
                <div className="flex flex-col h-full">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-stone-200 dark:border-stone-700">
                        <h2 className="text-xl font-semibold text-stone-900 dark:text-stone-100">Tu Cesta</h2>
                        <button
                            onClick={toggleCart}
                            className="p-2 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-full transition-colors"
                        >
                            <CloseIcon className="w-6 h-6 text-stone-500" />
                        </button>
                    </div>

                    {/* Items */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {cart.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-stone-500">
                                <p className="text-lg">Tu cesta está vacía</p>
                                <button
                                    onClick={toggleCart}
                                    className="mt-4 text-stone-900 dark:text-stone-100 font-medium underline"
                                >
                                    Continuar comprando
                                </button>
                            </div>
                        ) : (
                            cart.map((item) => (
                                <div key={item.id} className="flex gap-4 p-3 bg-stone-50 dark:bg-stone-800/50 rounded-lg">
                                    <div className="relative w-25 h-auto flex-shrink-0 bg-stone-200 rounded-md overflow-hidden">
                                        <CartItemThumbnail item={item} />
                                    </div>
                                    <div className="flex-1 flex flex-col justify-between">
                                        <div>
                                            <h3 className="font-medium text-stone-900 dark:text-stone-100 line-clamp-2">{item.title}</h3>
                                            <p className="text-sm text-stone-500 mt-1">Talla: {item.size}</p>
                                            <p className="text-sm text-stone-500">Color: {item.color}</p>
                                        </div>
                                        <div className="flex justify-between items-end mt-3">
                                            <div className="flex items-center gap-3 border border-stone-200 dark:border-stone-700 rounded-lg p-1">
                                                <button
                                                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                    disabled={item.quantity <= 1}
                                                    className="p-1 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-md transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
                                                    aria-label="Disminuir cantidad"
                                                >
                                                    <MinusIcon className="w-4 h-4" />
                                                </button>
                                                <span className="text-sm font-semibold w-4 text-center">{item.quantity}</span>
                                                <button
                                                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                    className="p-1 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-md transition-colors"
                                                    aria-label="Aumentar cantidad"
                                                >
                                                    <PlusIcon className="w-4 h-4" />
                                                </button>
                                            </div>
                                            <div className="flex flex-col items-end gap-1">
                                                <span className="font-bold text-stone-900 dark:text-stone-100">
                                                    S/ {((typeof item.price === 'string' ? parseFloat(item.price) : (item.price || 0)) * item.quantity).toFixed(2)}
                                                </span>
                                                <button
                                                    onClick={() => removeFromCart(item.id)}
                                                    className="text-xs text-red-500 hover:text-red-700 font-medium hover:underline"
                                                >
                                                    Eliminar
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Footer */}
                    {cart.length > 0 && (
                        <div className="p-4 border-t border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800">
                            <div className="flex justify-between items-center mb-4">
                                <span className="text-lg font-medium text-stone-900 dark:text-stone-100">Total</span>
                                <span className="text-2xl font-bold text-stone-900 dark:text-stone-100">
                                    S/ {cartTotal.toFixed(2)}
                                </span>
                            </div>
                            <button
                                onClick={handleCheckout}
                                className="w-full bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 py-3.5 rounded-lg font-bold hover:opacity-90 transition-opacity shadow-lg"
                            >
                                Solicitar Pedido
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default CartDrawer;
