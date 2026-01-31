import React, { useRef, useState, useEffect } from 'react';
import type { Garment } from '@/interfaces/Garment';
import { inventarioService } from '../services/inventarioService';
import { WhatsappIcon, EditIcon, DeleteIcon, SpinnerIcon, ErrorIcon, CircleIcon, CheckCircleIcon } from './Icons';

interface VideoCardProps {
  garment: Garment;
  onSelect: (garment: Garment) => void;
  isAdmin: boolean;
  onEdit: (garment: Garment) => void;
  onDelete: (id: number) => void;
  isSelectionMode: boolean;
  isSelected: boolean;
  onToggleSelection: (id: number) => void;
}

const VideoCard: React.FC<VideoCardProps> = ({ garment, onSelect, isAdmin, onEdit, onDelete, isSelectionMode, isSelected, onToggleSelection }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const cardRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isMediaLoading, setIsMediaLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  // isLoadingDetails removido para apertura instantánea

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      {
        rootMargin: '0px 0px 200px 0px',
      }
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
    setIsMediaLoading(true);
    setHasError(false);
  }, [garment.videoUrl]);

  const handleMouseEnter = () => {
    if (videoRef.current && !hasError && isVisible) {
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          // Ignore AbortError which is triggered when pause() interrupts play().
          if (error.name !== 'AbortError') {
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
    if (isSelectionMode) {
      onToggleSelection(garment.id);
    } else {
      // Abrir modal inmediatamente con la información actual
      onSelect(garment);

      // Obtener detalles completos en segundo plano
      inventarioService.obtenerDetalleProducto(garment.id)
        .then(fullGarment => {
          const garmentWithSlug = {
            ...fullGarment,
            slug: fullGarment.slug || garment.slug
          };
          onSelect(garmentWithSlug);
        })
        .catch(error => {
          console.error("Error fetching details:", error);
        });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(garment);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`¿Estás seguro de que quieres eliminar la prenda "${garment.title}"?`)) {
      onDelete(garment.id);
    }
  };

  const handleWhatsappClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const phoneNumber = "51956382746";
    let message = `Hola, me interesa la siguiente prenda:\n\n`;
    message += `*Producto:* ${garment.title}\n`;
    message += `*Marca:* ${garment.brand}\n`;
    message += `*ID de Producto:* ${garment.id}\n`;
    message += `*Talla:* ${garment.size}\n`;
    message += `*Color:* ${garment.color}\n`;
    if (garment.price) {
      const priceValue = typeof garment.price === 'string' ? parseFloat(garment.price) : garment.price;
      message += `*Precio:* S/ ${priceValue.toFixed(2)}\n`;
    }
    message += `\n¿Podrían darme más información sobre la disponibilidad?`;

    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  const handleCanPlay = () => setIsMediaLoading(false);
  const handleError = () => {
    setIsMediaLoading(false);
    setHasError(true);
  };

  const showSpinner = (isVisible && garment.videoUrl && isMediaLoading);
  // Mostrar contenido siempre que esté visible, incluso si el video falla
  const showContent = isVisible && !showSpinner;

  const cardDescription = `${garment.title} por ${garment.brand}, Talla ${garment.size}, Color ${garment.color}`;
  const actionLabel = isSelectionMode ? `Seleccionar` : `Ver detalles de`;

  return (
    <article
      ref={cardRef}
      className={`relative group aspect-[9/16] overflow-hidden rounded-lg shadow-lg transform transition-all duration-300 ease-in-out bg-stone-200 
        ${isSelectionMode ? 'cursor-pointer' : 'cursor-pointer hover:scale-105 focus:outline-none focus:ring-4 focus:ring-offset-2 focus:ring-stone-500'}
        ${isSelected ? 'ring-4 ring-offset-2 ring-sky-500' : ''}
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
        <div className="absolute inset-0 flex items-center justify-center z-10" aria-hidden="true">
          <SpinnerIcon className="w-10 h-10 text-stone-400 animate-spin" />
        </div>
      )}
      {isVisible && hasError && garment.videoUrl && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-stone-200 to-stone-300 dark:from-stone-700 dark:to-stone-800 z-10" aria-hidden="true">
          <ErrorIcon className="w-12 h-12 mb-2 text-stone-400" />
          <p className="text-sm font-semibold text-stone-600 dark:text-stone-300">Error al cargar el video</p>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">No se pudo mostrar la vista previa.</p>
        </div>
      )}

      {isVisible && !garment.videoUrl && (
        <div className="absolute inset-0 bg-gradient-to-br from-stone-200 to-stone-300 dark:from-stone-700 dark:to-stone-800 z-10" aria-hidden="true"></div>
      )}

      {garment.videoUrl && (
        <video
          ref={videoRef}
          key={garment.videoUrl}
          src={isVisible ? garment.videoUrl : undefined}
          loop
          muted
          playsInline
          preload="metadata"
          onCanPlay={handleCanPlay}
          onError={handleError}
          className={`w-full h-full object-cover transition-all duration-500 ease-in-out ${!isSelectionMode ? 'group-hover:scale-110' : ''} brightness-90 ${!isSelectionMode ? 'group-hover:brightness-100' : ''} ${!showContent ? 'opacity-0' : 'opacity-100'}`}
        >
          <title>Vista previa en video de {garment.title}</title>
        </video>
      )}
      <div className={`absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent transition-opacity duration-300 ${showContent ? 'opacity-100' : 'opacity-0'}`}></div>

      {isSelectionMode && (
        <div className="absolute top-4 left-4 z-20" aria-hidden="true">
          {isSelected ? (
            <CheckCircleIcon className="w-8 h-8 text-sky-500 bg-white rounded-full" />
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
              <button onClick={handleEdit} className="p-2 rounded-full bg-black/50 text-white hover:bg-black/80" aria-label={`Editar ${garment.title}`}>
                <EditIcon className="w-5 h-5" />
              </button>
              <button onClick={handleDelete} className="p-2 rounded-full bg-black/50 text-white hover:bg-black/80" aria-label={`Eliminar ${garment.title}`}>
                <DeleteIcon className="w-5 h-5" />
              </button>
            </div>
          )}
        </>
      )}

      {/* Contenido siempre visible cuando el card está visible, independientemente del estado del video */}
      <div className={`absolute bottom-0 left-0 p-6 w-full text-white transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
        <div className={`transform transition-transform duration-500 ease-in-out ${!isSelectionMode ? 'group-hover:-translate-y-2' : ''}`}>
          <h3 className="text-2xl font-semibold tracking-wide">{garment.title || 'Sin título'}</h3>
          {garment.price && (
            <p className="text-xl font-medium tracking-wide mt-1">S/ {typeof garment.price === 'string' ? parseFloat(garment.price).toFixed(2) : garment.price.toFixed(2)}</p>
          )}
          <div className={`h-0.5 w-12 bg-white/50 my-2 transition-all duration-500 ${!isSelectionMode ? 'group-hover:w-20' : ''}`}></div>
          <p className="text-sm uppercase tracking-widest text-stone-200">
            {garment.brand || 'Sin marca'} &middot; Talla: {garment.size || 'N/A'} {garment.color && `· ${garment.color}`}
          </p>
        </div>
      </div>
    </article>
  );
};

export default VideoCard;