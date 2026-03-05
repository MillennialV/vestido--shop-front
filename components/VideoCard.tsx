import React, { useRef, useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { slugify } from "@/lib/slugify";
import type { Garment } from "@/types/Garment";

import {
  WhatsappIcon,
  EditIcon,
  DeleteIcon,
  SpinnerIcon,
  ErrorIcon,
  CircleIcon,
  CheckCircleIcon,
  PlayIcon,
} from "./Icons";
import { trackWhatsAppClick } from "@/lib/analytics";

const isExternalVideo = (url: string) => {
  if (!url) return false;
  return (
    url.includes("youtube.com") ||
    url.includes("youtu.be") ||
    url.includes("vimeo.com")
  );
};

interface VideoCardProps {
  garment: Garment;
  onSelect?: (garment: Garment) => void;
  isAdmin?: boolean;
  onEdit?: (garment: Garment) => void;
  onDelete?: (garment: Garment) => void;
  isSelectionMode?: boolean;
  isSelected?: boolean;
  onToggleSelection?: (garment: Garment) => void;
  isDisabled?: boolean;
  priority?: boolean;
}

const VideoCard: React.FC<VideoCardProps> = ({
  garment,
  onSelect,
  isAdmin = false,
  onEdit,
  onDelete,
  isSelectionMode = false,
  isSelected = false,
  onToggleSelection,
  isDisabled = false,
  priority = false,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const cardRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isMediaLoading, setIsMediaLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  // isLoadingDetails removido para apertura instantánea

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      {
        rootMargin: "0px 0px 400px 0px",
      },
    );

    const currentCardRef = cardRef.current;
    if (currentCardRef) {
      observer.observe(currentCardRef);
    }

    return () => {
      if (currentCardRef) {
        observer.unobserve(currentCardRef);
      }
    };
  }, []);

  useEffect(() => {
    // Solo resetear estado de carga cuando la URL del video cambia
    setIsMediaLoading(true);
    setHasError(false);
  }, [garment.videoUrl]);

  useEffect(() => {
    // Manejar pausa cuando el video pierde visibilidad
    if (videoRef.current && !isVisible) {
      videoRef.current.currentTime = 0;
      videoRef.current.pause();
    }
  }, [isVisible]);

  const handleMouseEnter = () => {
    if (videoRef.current && !hasError && isVisible) {
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          // Ignore AbortError which is triggered when pause() interrupts play().
          if (error.name !== "AbortError") {
            console.error("Video play failed:", error);
          }
        });
      }
    }
  };

  const handleMouseLeave = () => {
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  };

  const handleClick = () => {
    if (isDisabled) return;

    if (isSelectionMode) {
      onToggleSelection?.(garment);
    } else {
      onSelect?.(garment);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleClick();
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onEdit?.(garment);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onDelete?.(garment);
  };

  const handleWhatsappClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const phoneNumber = "51956382746";
    let message = `Hola, me interesa la siguiente prenda:\n\n`;
    message += `*Producto:* ${garment.title}\n`;
    if (garment.brand && garment.brand !== "No identificable") {
      message += `*Marca:* ${garment.brand}\n`;
    }
    message += `*ID de Producto:* ${garment.id}\n`;
    message += `*Talla:* ${garment.size}\n`;
    message += `*Color:* ${garment.color}\n`;
    if (garment.price) {
      const priceValue =
        typeof garment.price === "string"
          ? parseFloat(garment.price)
          : garment.price;
      message += `*Precio:* S/ ${priceValue.toFixed(2)}\n`;
    }
    message += `\n¿Podrían darme más información sobre la disponibilidad?`;

    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    trackWhatsAppClick(garment.title, garment.id);
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
  };

  const handleCanPlay = () => setIsMediaLoading(false);
  const handleError = () => {
    setIsMediaLoading(false);
    setHasError(true);
  };

  const showSpinner = isVisible && garment.videoUrl && isMediaLoading;
  // Mostrar contenido siempre que esté visible, incluso si el video falla
  const showContent = isVisible && !showSpinner;
  const brandDisplay = garment.brand && garment.brand !== "No identificable" ? garment.brand : null;
  const currentSlug = garment.slug || slugify(garment.title, garment.id);

  const cardDescription = `${garment.title}${brandDisplay ? ` por ${brandDisplay}` : ""}, Talla ${garment.size}, Color ${garment.color}`;
  const actionLabel = isSelectionMode ? `Seleccionar` : `Ver detalles de`;

  const cardContent = (
    <article
      ref={cardRef}
      className={`relative group aspect-[9/16] overflow-hidden rounded-[20px] shadow-lg transform transition-all duration-300 ease-in-out bg-stone-900 
        w-full mx-auto
        ${isDisabled ? "cursor-not-allowed opacity-75 grayscale-[0.5]" : isSelectionMode ? "cursor-pointer" : "cursor-pointer hover:scale-105 focus:outline-none focus:ring-4 focus:ring-offset-2 focus:ring-stone-500"}
        ${isSelected ? "ring-4 ring-offset-2 ring-sky-500" : ""}
      `}
      onMouseEnter={!isSelectionMode ? handleMouseEnter : undefined}
      onMouseLeave={!isSelectionMode ? handleMouseLeave : undefined}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={`${actionLabel}: ${cardDescription}`}
      aria-pressed={isSelectionMode ? isSelected : undefined}
    >
      {showSpinner && (
        <div
          className="absolute inset-0 flex items-center justify-center z-10"
          aria-hidden="true"
        >
          <SpinnerIcon className="w-10 h-10 text-stone-400 animate-spin" />
        </div>
      )}
      {isVisible && hasError && garment.videoUrl && (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-stone-200 to-stone-300 dark:from-stone-700 dark:to-stone-800 z-10"
          aria-hidden="true"
        >
          <ErrorIcon className="w-12 h-12 mb-2 text-stone-400" />
          <p className="text-sm font-semibold text-stone-600 dark:text-stone-300">
            Error al cargar el video
          </p>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
            No se pudo mostrar la vista previa.
          </p>
        </div>
      )}

      {isVisible && !garment.videoUrl && !garment.imagen_principal && (
        <div
          className="absolute inset-0 bg-stone-300 dark:bg-stone-700 z-0"
          aria-hidden="true"
        ></div>
      )}

      {garment.videoUrl && !isExternalVideo(garment.videoUrl) ? (
        <video
          ref={videoRef}
          key={garment.videoUrl}
          src={garment.videoUrl}
          poster={garment.imagen_principal}
          loop
          muted
          playsInline
          preload={priority ? "auto" : "metadata"}
          onCanPlay={handleCanPlay}
          onError={handleError}
          className={`w-full h-full object-cover transition-all duration-500 ease-in-out ${!isSelectionMode ? "group-hover:scale-110" : ""}`}
          title={`Vista previa en video de ${garment.title}`}
        />
      ) : garment.imagen_principal ? (
        <Image
          src={garment.imagen_principal}
          alt={garment.title}
          fill
          unoptimized
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className={`object-cover transition-all duration-500 ease-in-out ${!isSelectionMode ? "group-hover:scale-110" : ""}`}
          onLoad={() => setIsMediaLoading(false)}
          onError={handleError}
          priority={priority}
        />
      ) : null}
      <div
        className={`absolute inset-0 transition-opacity duration-300 z-10 opacity-100`}
      ></div>

      {isSelectionMode && (
        <div className="absolute top-4 left-4 z-30" aria-hidden="true">
          {isSelected ? (
            <CheckCircleIcon className="w-8 h-8 text-sky-500 bg-white rounded-full shadow-lg" />
          ) : (
            <CircleIcon className="w-8 h-8 text-white bg-black/30 rounded-full" />
          )}
        </div>
      )}

      {!isSelectionMode && (
        <>
          <div className="absolute top-4 left-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
            <button
              onClick={handleWhatsappClick}
              className="p-2 rounded-full bg-green-500 text-white hover:bg-green-600 transition-colors shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black/50 focus:ring-white"
              aria-label={`Consultar sobre ${garment.title} por WhatsApp`}
            >
              <WhatsappIcon className="w-5 h-5" />
            </button>
          </div>

          {isAdmin && (
            <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
              <button
                onClick={handleEdit}
                className="p-2 rounded-full bg-color-three/50 text-color-four hover:bg-color-three/80 "
                aria-label={`Editar ${garment.title}`}
              >
                <EditIcon className="w-5 h-5" />
              </button>
              <button
                onClick={handleDelete}
                className="p-2 rounded-full bg-color-three/50 text-color-four hover:bg-color-three/80 "
                aria-label={`Eliminar ${garment.title}`}
              >
                <DeleteIcon className="w-5 h-5" />
              </button>
            </div>
          )}
        </>
      )}

      {/* Contenido siempre visible cuando el card está visible, independientemente del estado del video */}
      <div
        className={`absolute bottom-0 left-0 p-6 w-full text-white transition-opacity duration-300 z-20 opacity-100`}
      >
        <div
          className={`transform transition-transform duration-500 ease-in-out ${!isSelectionMode ? "group-hover:-translate-y-2" : ""}`}
        >
          <h3 className="font-title-card text-center sm:px-[25%]">
            {garment.title || "Sin título"}
          </h3>

          <p className="font-subtitle-card text-center pt-[17px]">
            {brandDisplay && (
              <>{brandDisplay} &middot; </>
            )}
            Talla: {garment.size || "N/A"} {garment.color && `· ${garment.color}`}
            {garment.price && ` · S/ ${garment.price}`}
            {isAdmin && garment.cantidad !== undefined && (
              <span className={`block mt-1 font-bold ${garment.cantidad > 0 ? 'text-green-400' : 'text-red-400'}`}>
                Stock: {garment.cantidad}
              </span>
            )}
          </p>
        </div>
      </div>
    </article>
  );

  if (!isSelectionMode) {
    return (
      <Link
        href={`/producto/${currentSlug}`}
        onClick={(e) => {
          e.preventDefault();
          handleClick();
        }}
        className="w-full flex"
      >
        {cardContent}
      </Link>
    );
  }

  return cardContent;
};

export default VideoCard;
