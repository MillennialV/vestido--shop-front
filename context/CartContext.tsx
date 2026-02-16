"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import type { Garment } from '@/types/Garment';

interface CartItem extends Garment {
    quantity: number;
}

interface CartContextType {
    cart: CartItem[];
    addToCart: (item: Garment) => void;
    removeFromCart: (itemId: number) => void;
    updateQuantity: (itemId: number, quantity: number) => void;
    clearCart: () => void;
    isInCart: (itemId: number) => boolean;
    totalItems: number;
    cartTotal: number;
    isCartOpen: boolean;
    toggleCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [cart, setCart] = useState<CartItem[]>([]);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);

    // Load from localStorage on mount
    useEffect(() => {
        const savedCart = localStorage.getItem('shopping-cart');
        if (savedCart) {
            try {
                setCart(JSON.parse(savedCart));
            } catch (e) {
                console.error("Failed to parse cart from localStorage", e);
            }
        }
        setIsLoaded(true);
    }, []);

    // Save to localStorage on change
    useEffect(() => {
        if (isLoaded) {
            localStorage.setItem('shopping-cart', JSON.stringify(cart));
        }
    }, [cart, isLoaded]);

    const addToCart = (item: Garment) => {
        setCart((prev) => {
            const existing = prev.find((i) => i.id === item.id);
            if (existing) {
                return prev.map((i) =>
                    i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
                );
            }
            return [...prev, { ...item, quantity: 1 }];
        });
        // Optional: Open cart when adding
        setIsCartOpen(true);
    };

    const removeFromCart = (itemId: number) => {
        setCart((prev) => prev.filter((item) => item.id !== itemId));
    };

    const updateQuantity = (itemId: number, quantity: number) => {
        if (quantity < 1) return;
        setCart((prev) => prev.map((item) =>
            item.id === itemId ? { ...item, quantity } : item
        ));
    };

    const clearCart = () => {
        setCart([]);
    };

    const isInCart = (itemId: number) => {
        return cart.some((item) => item.id === itemId);
    };

    const toggleCart = () => setIsCartOpen(!isCartOpen);

    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

    const cartTotal = cart.reduce((sum, item) => {
        const priceVal = typeof item.price === 'string' ? parseFloat(item.price) : (item.price || 0);
        return sum + (isNaN(priceVal) ? 0 : priceVal) * item.quantity;
    }, 0);

    return (
        <CartContext.Provider
            value={{
                cart,
                addToCart,
                removeFromCart,
                updateQuantity,
                clearCart,
                isInCart,
                totalItems,
                cartTotal,
                isCartOpen,
                toggleCart,
            }}
        >
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
};
