import React from 'react';
import Image from 'next/image';
import { MinusIcon, PlusIcon } from '@/components/ui/Icons';

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
                className="flex object-cover rounded-[16px]"
            />

        );
    }
    if (item.videoUrl && !isExternalVideo(item.videoUrl)) {
        return (
            <video
                src={`${item.videoUrl}#t=0.1`}
                className="w-full h-full object-cover rounded-l-[16px]"
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
    return <div className="w-full h-full bg-stone-200 flex items-center justify-center text-stone-400 text-xs text-center p-1 rounded-l-[16px]">Sin imagen</div>;
};

interface ItemCartProps {
    item: any;
    updateQuantity: (id: number, quantity: number) => void;
    removeFromCart: (id: number) => void;
}

const ItemCart: React.FC<ItemCartProps> = ({ item, updateQuantity, removeFromCart }) => {
    return (
        <div className="flex w-full bg-color-background/20 dark:bg-color-background-dark/20 backdrop-blur-lg rounded-[16px] overflow-hidden mb-[10px] shadow-md relative">
            <div className="w-[70px] sm:w-[80px]  m-[8px] flex-shrink-0 relative">
                <CartItemThumbnail item={item} />
            </div>

            <div className="flex-1 p-2 sm:p-3 flex flex-col justify-between">
                <div className="mb-1">
                    <h3 className="uppercase text-color-three dark:text-color-four text-[12px] sm:text-[13px] md:text-[14px] font-[500] leading-tight mb-1 sm:mb-2 tracking-wide font-allrounder-monument-test-regular line-clamp-2">
                        {item.title}
                    </h3>
                    <p className="hidden sm:block text-color-disable text-[10px] sm:text-xs mb-0.5 sm:mb-1 font-inter">Talla: {item.size}</p>
                    <p className="hidden sm:block text-color-disable text-[10px] sm:text-xs font-inter">Color: {item.color}</p>
                </div>

                <div className="flex flex-col items-end mt-1 gap-1">
                    <span className="font-[600] text-color-three dark:text-color-four text-[14px] xs:text-[15px] sm:text-[18px] md:text-[20px] font-inter">
                        S/. {((typeof item.price === 'string' ? parseFloat(item.price) : (item.price || 0)) * item.quantity).toFixed(0)}
                    </span>
                    <div className="flex items-center gap-1 sm:gap-4 rounded-full border border-stone-500/50 px-1.5 sm:px-3 py-1 bg-transparent">
                        <button
                            onClick={() => item.quantity <= 1 ? removeFromCart(item.id) : updateQuantity(item.id, item.quantity - 1)}
                            className={`p-1 transition-colors ${item.quantity <= 1 ? 'text-red-500 hover:text-red-400' : 'text-color-three dark:text-color-four hover:text-stone-300'}`}
                            aria-label={item.quantity <= 1 ? "Eliminar del carrito" : "Disminuir cantidad"}
                        >
                            {item.quantity <= 1 ? (
                                <svg width="20" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3 sm:w-4 sm:h-4">
                                    <polyline points="3 6 5 6 21 6"></polyline>
                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                    <line x1="10" y1="11" x2="10" y2="17"></line>
                                    <line x1="14" y1="11" x2="14" y2="17"></line>
                                </svg>
                            ) : (
                                <MinusIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                            )}
                        </button>
                        <span className="text-[13px] sm:text-[15px] font-[400] text-color-three dark:text-color-four w-3 sm:w-4 text-center font-inter">{item.quantity}</span>
                        <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="p-1 text-color-three dark:text-color-four hover:text-stone-300 transition-colors"
                            aria-label="Aumentar cantidad"
                        >
                            <PlusIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ItemCart;
