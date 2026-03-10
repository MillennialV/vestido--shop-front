"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { ChevronLeftIcon, ChevronRightIcon, EditIcon, DeleteIcon } from "@/components/ui/Icons";

export interface CarouselSlide {
    id: string | number;
    imageUrl: string;
    title?: string;
    subtitle?: string;
    altText?: string;
}

interface ImageCarouselProps {
    slides: CarouselSlide[];
    autoPlayInterval?: number; // en milisegundos, 0 para desactivar
    isAdmin?: boolean;
    onEdit?: (slide: CarouselSlide) => void;
    onDelete?: (slide: CarouselSlide) => void;
}

const ImageCarousel: React.FC<ImageCarouselProps> = ({
    slides,
    autoPlayInterval = 5000,
    isAdmin = false,
    onEdit,
    onDelete,
}) => {
    const [currentIndex, setCurrentIndex] = useState(0);

    const nextSlide = useCallback(() => {
        setCurrentIndex((prevIndex) =>
            prevIndex === slides.length - 1 ? 0 : prevIndex + 1
        );
    }, [slides.length]);

    const prevSlide = useCallback(() => {
        setCurrentIndex((prevIndex) =>
            prevIndex === 0 ? slides.length - 1 : prevIndex - 1
        );
    }, [slides.length]);

    useEffect(() => {
        if (autoPlayInterval > 0 && slides.length > 1) {
            const slideInterval = setInterval(nextSlide, autoPlayInterval);
            return () => clearInterval(slideInterval);
        }
    }, [currentIndex, autoPlayInterval, nextSlide, slides.length]);

    useEffect(() => {
        // Resetea el índice al cambiar los filtros para que no quede fuera de rango
        setCurrentIndex(0);
    }, [slides]);

    if (!slides || slides.length === 0) {
        return null; // o un skeleton loader
    }

    return (
        <div className="relative w-full h-[200px] sm:h-[300px] md:h-[400px] lg:h-[500px] rounded-2xl overflow-hidden group bg-color-background dark:bg-color-background-dark mb-5">
            {/* Track */}
            <div className="relative w-full h-full">
                {slides.map((slide, index) => (
                    <div
                        key={slide.id}
                        className={`absolute top-0 left-0 w-full h-full transition-opacity duration-1000 ease-in-out ${index === currentIndex
                            ? "opacity-100 z-10"
                            : "opacity-0 z-0 pointer-events-none"
                            }`}
                    >
                        {/* El secreto es el objectFit="cover" (o object-cover en Tailwind). */}
                        <Image
                            src={slide.imageUrl}
                            alt={slide.altText || slide.title || `Slide ${index}`}
                            fill
                            unoptimized
                            className="object-cover"
                            priority={index === 0}
                        />

                        {/* Overlay Gradiente Oscuro para mejor lectura de texto */}


                        {/* Botones de Administrador superpuestos (Esquina Superior Derecha) */}
                        {isAdmin && (
                            <div className="absolute top-4 right-4 z-30 flex gap-2">
                                {onEdit && (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onEdit(slide); }}
                                        className="w-10 h-10 bg-white/10 hover:bg-stone-800/80 backdrop-blur-md rounded-full flex items-center justify-center text-white transition-all shadow-md group-hover:bg-stone-800"
                                        title="Editar Banner"
                                    >
                                        <EditIcon className="w-5 h-5 text-white" />
                                    </button>
                                )}
                                {onDelete && (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onDelete(slide); }}
                                        className="w-10 h-10 bg-white/10 hover:bg-red-600/90 backdrop-blur-md rounded-full flex items-center justify-center text-white transition-all shadow-md group-hover:bg-red-600"
                                        title="Eliminar Banner"
                                    >
                                        <DeleteIcon className="w-5 h-5 text-white" />
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Navegación - Controles Flechas (solo se muestran si hay más de 1 slide) */}
            {slides.length > 1 && (
                <>
                    <button
                        onClick={prevSlide}
                        className="absolute top-1/2 left-4 md:left-8 -translate-y-1/2 z-20 w-12 h-12 flex items-center justify-center bg-black/30 hover:bg-black/60 text-white rounded-full backdrop-blur-sm transition-all duration-300 opacity-0 group-hover:opacity-100 focus:opacity-100"
                        aria-label="Imagen anterior"
                    >
                        <ChevronLeftIcon className="w-6 h-6" />
                    </button>
                    <button
                        onClick={nextSlide}
                        className="absolute top-1/2 right-4 md:right-8 -translate-y-1/2 z-20 w-12 h-12 flex items-center justify-center bg-black/30 hover:bg-black/60 text-white rounded-full backdrop-blur-sm transition-all duration-300 opacity-0 group-hover:opacity-100 focus:opacity-100"
                        aria-label="Siguiente imagen"
                    >
                        <ChevronRightIcon className="w-6 h-6" />
                    </button>
                </>
            )}

        </div>
    );
};

export default ImageCarousel;
