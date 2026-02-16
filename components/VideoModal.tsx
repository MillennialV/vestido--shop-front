"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import type { Garment } from "@/types/Garment";
import ThumbnailStrip from "./ThumbnailStrip";
import QrCodeModal from "./QrCodeModal";
import { PUBLIC_URL } from "../lib/seo";
import { slugify } from "../lib/slugify";
import AccordionItem from "./AccordionItem";
import {
  CloseIcon,
  SpinnerIcon,
  WhatsappIcon,
  ShareIcon,
  QrCodeIcon,
  TikTokIcon,
  InstagramIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "./Icons";
import { title } from "process";

const getEmbedUrl = (url: string) => {
  if (!url) return null;
  if (url.includes("youtube.com") || url.includes("youtu.be")) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|shorts\/)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return match && match[2] && match[2].length === 11
      ? `https://www.youtube.com/embed/${match[2]}?autoplay=1&mute=1`
      : null;
  }
  if (url.includes("vimeo.com")) {
    const regExp =
      /vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/([^\/]*)\/videos\/|album\/(\d+)\/video\/|video\/|)(\d+)(?:$|\/|\?)/;
    const match = url.match(regExp);
    return match ? `https://player.vimeo.com/video/${match[3]}` : null;
  }
  return null;
};

interface VideoModalProps {
  isOpen: boolean;
  garment?: Garment;
  onClose: () => void;
  garmentList: Garment[];
  onChangeGarment: (garment: Garment) => void;
}

const VideoModal: React.FC<VideoModalProps> = ({
  isOpen,
  garment,
  onClose,
  garmentList,
  onChangeGarment,
}) => {
  const [isRendered, setIsRendered] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsRendered(true);
      setTimeout(() => setIsVisible(true), 10);
    } else {
      setIsVisible(false);
      const timer = setTimeout(() => setIsRendered(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Gallery State & Logic
  interface MediaItem {
    id: string;
    type: "video" | "image";
    url: string;
    thumbnail?: string;
  }
  const [mediaList, setMediaList] = useState<MediaItem[]>([]);
  const [activeMedia, setActiveMedia] = useState<MediaItem | null>(null);

  useEffect(() => {
    if (garment) {
      const list: MediaItem[] = [];

      // 1. Video
      if (garment.videoUrl) {
        list.push({
          id: 'video',
          type: 'video',
          url: garment.videoUrl,
          thumbnail: garment.imagen_principal
        });
      }

      // 2. Main Image
      if (garment.imagen_principal) {
        list.push({
          id: 'main',
          type: 'image',
          url: garment.imagen_principal
        });
      }

      // 3. Extra Images
      if (garment.imagenes && garment.imagenes.length > 0) {
        garment.imagenes.forEach((img, idx) => {
          // Avoid adding the main image again if it is already in the list (simple URL check)
          const isDuplicate = list.some(existing => existing.url === img);
          if (!isDuplicate) {
            list.push({
              id: `extra-${idx}`,
              type: 'image',
              url: img
            });
          }
        });
      }

      setMediaList(list);
      // Reset active media to first item when garment changes
      setActiveMedia(list.length > 0 ? list[0] : null);
    }
  }, [garment]);

  const handleNextMedia = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!activeMedia || mediaList.length <= 1) return;
    const currentIndex = mediaList.findIndex(m => m.id === activeMedia.id);
    const nextIndex = (currentIndex + 1) % mediaList.length;
    setActiveMedia(mediaList[nextIndex]);
  };

  const handlePrevMedia = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!activeMedia || mediaList.length <= 1) return;
    const currentIndex = mediaList.findIndex(m => m.id === activeMedia.id);
    const prevIndex = (currentIndex - 1 + mediaList.length) % mediaList.length;
    setActiveMedia(mediaList[prevIndex]);
  };
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isThumbnailStripVisible, setIsThumbnailStripVisible] = useState(true);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [openAccordion, setOpenAccordion] = useState<string | null>(
    "description",
  );
  const [isVideoLoading, setIsVideoLoading] = useState(true);
  const [videoError, setVideoError] = useState<string | null>(null);

  const handleAccordionClick = (id: string) => {
    setOpenAccordion((prev) => (prev === id ? null : id));
  };

  const handleVideoCanPlay = () => {
    console.log("[VideoModal] Video can play");
    setIsVideoLoading(false);
    setVideoError(null);
  };

  const handleVideoError = (
    e: React.SyntheticEvent<HTMLVideoElement, Event>,
  ) => {
    const event = e.nativeEvent as ErrorEvent;
    console.error("[VideoModal] Error loading video:", event);
    setIsVideoLoading(false);
    setVideoError("No se pudo cargar el video");
  };

  const handleVideoLoadStart = () => {
    console.log("[VideoModal] Video loading started");
    setIsVideoLoading(true);
    setVideoError(null);
  };

  const handleClose = () => {
    onClose();
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        handleClose();
        return;
      }

      if (!garment) return;
      const currentIndex = garmentList.findIndex((g) => g.id === garment.id);
      if (currentIndex === -1) return;

      let nextIndex = -1;

      if (event.key === "ArrowRight") {
        nextIndex = (currentIndex + 1) % garmentList.length;
      } else if (event.key === "ArrowLeft") {
        nextIndex =
          (currentIndex - 1 + garmentList.length) % garmentList.length;
      }

      if (nextIndex !== -1) {
        event.preventDefault();
        onChangeGarment(garmentList[nextIndex]);
      }
    };

    closeButtonRef.current?.focus();

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, garment, garmentList, onChangeGarment]);

  useEffect(() => {
    // Reset video loading state only when active media changes and is a video
    if (activeMedia?.type === 'video') {
      setIsVideoLoading(true);
      setVideoError(null);
    }
  }, [activeMedia]);

  const handleShare = async () => {
    if (!garment) return;
    const currentSlug = garment.slug || slugify(garment.title, garment.id);
    const shareUrl = `${PUBLIC_URL}/#/${currentSlug}`;
    const shareText = `Mira este vestido: ${garment.title} - Colección Womanity Boutique.`;

    try {
      const shareItem = {
        title: garment.title,
        text: shareText,
        url: shareUrl,
      };

      if (navigator.share) {
        await navigator.share({
          title: shareItem.title,
          text: shareItem.text,
          url: shareItem.url,
        });
        console.log("Contenido (solo texto) compartido exitosamente");
      } else {
        throw new Error("Funcion no disponible en este navegador");
      }

    } catch (error) {
      await navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
      setToastMessage("¡Enlace copiado al portapapeles para compartir!");
    } finally {
      setTimeout(() => setToastMessage(null), 3000);
    }

  };


  const isMobileDevice = () => {
    if (typeof navigator === "undefined") return false;
    return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  };

  const shareFileToApps = async (fileUrl: string, garment: Garment) => {
    try {
      const response = await fetch(fileUrl);
      const blob = await response.blob();

      const file = new File([blob], "vestidos.mp4", {
        type: blob.type,
      });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `${garment.title}`,
          text: `Mira este vestido: ${garment.title} - Colección Womanity Boutique.`,
        });
      } else {
        throw new Error("Share with files not supported");
      }
    } catch (err) {
      console.error(err);
      alert("Tu navegador no soporta compartir archivos directamente.");
    }
  };

  const handleSocialShare = async (platform: "TikTok" | "Instagram") => {
    if (!garment) return;

    const currentSlug = garment.slug || slugify(garment.title, garment.id);
    const shareUrl = `${PUBLIC_URL}/#/${currentSlug}`;
    const shareText = `Mira este vestido: ${garment.title} - Colección Womanity Boutique.`;

    const isMobile = isMobileDevice();

    // ----------- COMPARTIR NATIVO (Android/iOS) -----------
    if (isMobile && navigator.share) {
      try {
        await navigator.share({
          title: garment.title,
          text: shareText,
          url: shareUrl,
        });
        return;
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          console.error("Error en navigator.share:", err);
        }
      }
    }

    // ----------- INSTAGRAM -----------
    if (platform === "Instagram") {

      if (isMobile) {

        if (garment.videoUrl) {
          try {
            await shareFileToApps(garment.videoUrl, garment);
            return;
          } catch (err) {
            console.warn("No se pudo compartir archivo, usamos fallback");
          }
        }

        await navigator.clipboard.writeText(`${shareText} ${shareUrl}`);

        setToastMessage(
          "Elige Instagram en el menú para compartir, o pega el enlace copiado."
        );

        return;
      }

      // Desktop
      await navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
      setToastMessage("Comparte este enlace desde tu celular para Instagram.");
    }

    if (platform === "TikTok") {
      try {
        await navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
        setToastMessage("Enlace copiado. ¡Pégalo en TikTok!");
        window.open("https://www.tiktok.com/messages", "_blank");
      } catch (err) {
        console.error("Error copiando enlace TikTok:", err);
        setToastMessage("No se pudo copiar el enlace.");
      }
    }
  };

  const phoneNumber = "51956382746";
  let message = `Hola, me interesa la siguiente prenda:\n\n`;
  if (garment) {
    message += `*Producto:* ${garment.title}\n`;
    message += `*Marca:* ${garment.brand}\n`;
    message += `*ID de Producto:* ${garment.id}\n`;
    message += `*Talla:* ${garment.size}\n`;
    message += `*Color:* ${garment.color}\n`;
    if (garment.price) {
      const priceValue =
        typeof garment.price === "string"
          ? parseFloat(garment.price)
          : garment.price;
      if (!isNaN(priceValue)) {
        message += `*Precio:* S/ ${priceValue.toFixed(2)}\n`;
      } else {
        message += `*Precio:* S/ ${garment.price}\n`;
      }
    }
    if (garment.slug) {
      const productUrl = `${PUBLIC_URL}/#/${garment.slug}`;
      message += `*Enlace:* ${productUrl}\n`;
    }
  }
  message += `\n¿Podrían darme más información sobre la disponibilidad?`;

  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;

  if (!isRendered || !garment) return null;

  return (
    <div
      className={`fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 transition-opacity duration-300 ease-in-out ${isVisible ? 'opacity-100' : 'opacity-0'}`}
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        className={`relative bg-stone-50 dark:bg-stone-800 rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden transition-all duration-300 ease-in-out ${isVisible ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-8'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          ref={closeButtonRef}
          onClick={handleClose}
          className="absolute top-4 right-4 text-stone-800 dark:text-stone-200 hover:text-black dark:hover:text-white bg-white/70 dark:bg-stone-700/70 hover:bg-white/90 dark:hover:bg-stone-700/90 backdrop-blur-sm rounded-full p-2 shadow-lg transition-all focus:outline-none focus:ring-4 focus:ring-offset-2 focus:ring-stone-500 dark:focus:ring-stone-400 z-20"
          aria-label="Cerrar modal"
        >
          <CloseIcon className="w-6 h-6" />
        </button>

        {toastMessage && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-cyan-500 text-white text-sm font-bold px-4 py-2 rounded-full animate-fade-in-out z-30">
            {toastMessage}
          </div>
        )}

        <div className="flex flex-col md:flex-row flex-grow overflow-y-auto md:overflow-hidden gap-0 custom-scrollbar">
          {/* Gallery Section - Video/Image Stage */}
          <div className="relative w-full md:w-1/2 flex flex-col bg-stone-100 dark:bg-stone-900 md:sticky md:top-0 md:h-screen md:max-h-[90vh]">

            {/* Main Stage */}
            <div className="relative w-full flex-grow bg-black flex items-center justify-center overflow-hidden aspect-[3/4] md:aspect-auto">

              {/* Navigation Arrows (Overlay) */}
              {mediaList.length > 1 && (
                <>
                  <button
                    onClick={handlePrevMedia}
                    className="absolute left-2 md:left-4 z-20 p-2 rounded-full bg-white/10 hover:bg-white/30 text-white transition-all backdrop-blur-sm group"
                    aria-label="Anterior elemento"
                  >
                    <ChevronLeftIcon className="w-6 h-6 md:w-8 md:h-8 opacity-75 group-hover:opacity-100" />
                  </button>
                  <button
                    onClick={handleNextMedia}
                    className="absolute right-2 md:right-4 z-20 p-2 rounded-full bg-white/10 hover:bg-white/30 text-white transition-all backdrop-blur-sm group"
                    aria-label="Siguiente elemento"
                  >
                    <ChevronRightIcon className="w-6 h-6 md:w-8 md:h-8 opacity-75 group-hover:opacity-100" />
                  </button>
                </>
              )}

              {/* Media Content */}
              {activeMedia?.type === 'video' ? (
                <>
                  {isVideoLoading && (
                    <div className="absolute inset-0 flex items-center justify-center z-10 bg-black/50">
                      <SpinnerIcon className="w-10 h-10 text-white animate-spin" />
                    </div>
                  )}
                  {videoError && (
                    <div className="absolute inset-0 flex items-center justify-center z-10 bg-black/80">
                      <div className="text-center text-white p-4">
                        <p className="text-lg font-semibold mb-2">Error</p>
                        <p className="text-sm opacity-80">{videoError}</p>
                      </div>
                    </div>
                  )}
                  {getEmbedUrl(activeMedia.url) ? (
                    <iframe
                      src={getEmbedUrl(activeMedia.url)!}
                      className="w-full h-full border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      onLoad={() => setIsVideoLoading(false)}
                    />
                  ) : (
                    <video
                      ref={videoRef}
                      key={activeMedia.url}
                      src={activeMedia.url}
                      autoPlay
                      loop
                      muted
                      controls
                      playsInline
                      preload="auto"
                      onCanPlay={handleVideoCanPlay}
                      onError={handleVideoError}
                      onLoadStart={handleVideoLoadStart}
                      className="w-full h-full object-contain"
                    />
                  )}
                </>
              ) : activeMedia?.type === 'image' ? (
                <div className="relative w-full h-full">
                  <Image
                    src={activeMedia.url}
                    alt={garment?.title || 'Imagen del producto'}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-contain"
                    priority
                  />
                </div>
              ) : (
                <div className="text-white text-center p-8">
                  <SpinnerIcon className="w-10 h-10 text-white animate-spin mb-4 mx-auto" />
                  <p className="text-sm opacity-80">Cargando...</p>
                </div>
              )}

              {/* Action Buttons (QR / Share) positioned inside the stage */}
              <div className="absolute top-4 left-4 z-10 flex flex-col gap-3">
                {/* Empty for now or maybe brand logo? */}
              </div>

              <div className="absolute bottom-20 md:bottom-24 right-4 z-10 flex flex-col items-center gap-3">
                <button
                  onClick={() => setIsQrModalOpen(true)}
                  className="flex flex-col items-center text-white focus:outline-none rounded-full p-1 opacity-80 hover:opacity-100 transition-opacity"
                >
                  <span className="bg-black/40 backdrop-blur-md rounded-full p-2.5 shadow-lg border border-white/10">
                    <QrCodeIcon className="w-5 h-5 text-white" />
                  </span>
                </button>
                <button
                  onClick={handleShare}
                  className="flex flex-col items-center text-white focus:outline-none rounded-full p-1 opacity-80 hover:opacity-100 transition-opacity"
                >
                  <span className="bg-black/40 backdrop-blur-md rounded-full p-2.5 shadow-lg border border-white/10">
                    <ShareIcon className="w-5 h-5 text-white" />
                  </span>
                </button>
              </div>
            </div>

            {/* Internal Thumbnail Strip */}
            {mediaList.length > 1 && (
              <div className="w-full h-auto min-h-[80px] bg-black z-20 flex items-center gap-2 overflow-x-auto px-4 py-3 custom-scrollbar border-t border-stone-200 dark:border-stone-700 flex-shrink-0">
                {mediaList.map((item, index) => (
                  <button
                    key={`${item.id}-${index}`}
                    onClick={(e) => { e.stopPropagation(); setActiveMedia(item); }}
                    className={`relative flex-shrink-0 w-14 h-14 md:w-16 md:h-16 rounded-lg overflow-hidden transition-all duration-300 border-2 ${activeMedia?.id === item.id ? 'border-stone-800 dark:border-white opacity-100 ring-1 ring-stone-800 dark:ring-white' : 'border-transparent opacity-60 hover:opacity-100 hover:border-stone-400'}`}
                  >
                    {item.type === 'video' ? (
                      <div className="w-full h-full bg-stone-900 flex items-center justify-center relative">
                        {item.thumbnail ? (
                          <Image src={item.thumbnail} alt="Video" fill className="object-cover" />
                        ) : (
                          <div className="w-full h-full bg-stone-800" />
                        )}
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                          <div className="w-6 h-6 bg-white/90 rounded-full flex items-center justify-center">
                            <span className="text-black text-[10px] ml-0.5">▶</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <Image
                        src={item.url}
                        alt={`Vista ${index}`}
                        fill
                        className="object-cover"
                        sizes="80px"
                      />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="w-full md:w-1/2 p-8 lg:p-12 flex flex-col md:overflow-y-auto custom-scrollbar">
            <div className="flex-shrink-0">
              <p className="text-sm uppercase tracking-widest text-stone-500 dark:text-stone-400">
                {garment.brand}
              </p>
              <h2
                id="modal-title"
                className="text-4xl lg:text-5xl font-semibold text-stone-900 dark:text-stone-100 mt-2 mb-4"
              >
                {garment.title}
              </h2>
              {garment.price && (
                <p className="text-3xl text-stone-700 dark:text-stone-200 font-light mb-4">
                  S/{" "}
                  {typeof garment.price === "number"
                    ? garment.price.toFixed(2)
                    : garment.price}
                </p>
              )}
              <div className="flex flex-col sm:flex-row items-center gap-4 mb-6 flex-wrap">
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center grow sm:grow-0 px-6 py-3 font-semibold text-white bg-green-500 rounded-lg shadow-md hover:bg-green-600 transition-colors focus:outline-none focus:ring-4 focus:ring-offset-2 focus:ring-green-500"
                >
                  <WhatsappIcon className="w-5 h-5 mr-3" />
                  Consultar por WhatsApp
                </a>
                <button
                  onClick={handleShare}
                  className="inline-flex items-center justify-center gap-2 grow sm:grow-0 px-6 py-3 font-semibold text-stone-700 dark:text-stone-200 bg-white dark:bg-stone-700 rounded-lg shadow-md border border-stone-300 dark:border-stone-600 hover:bg-stone-100 dark:hover:bg-stone-600 transition-colors focus:outline-none focus:ring-4 focus:ring-offset-2 focus:ring-stone-500 dark:focus:ring-stone-400"
                  aria-label="Copiar enlace de la prenda"
                >
                  <ShareIcon className="w-5 h-5" />
                  Copiar Enlace
                </button>
              </div>
            </div>

            <div className="flex-grow">
              <AccordionItem
                title="Descripción"
                isOpen={openAccordion === "description"}
                onClick={() => handleAccordionClick("description")}
              >
                <p className="leading-relaxed">{garment.description}</p>
              </AccordionItem>
              <AccordionItem
                title="Detalles del Producto"
                isOpen={openAccordion === "details"}
                onClick={() => handleAccordionClick("details")}
              >
                <ul className="space-y-2 list-disc list-inside">
                  {garment.material && (
                    <li>
                      <strong>Material:</strong> {garment.material}
                    </li>
                  )}
                  {garment.occasion && (
                    <li>
                      <strong>Ocasión Ideal:</strong> {garment.occasion}
                    </li>
                  )}
                  {garment.style_notes && (
                    <li>
                      <strong>Notas de Estilo:</strong> {garment.style_notes}
                    </li>
                  )}
                  <li>
                    <strong>Color:</strong> {garment.color}
                  </li>
                  <li>
                    <strong>Tallas Disponibles:</strong> {garment.size}
                  </li>
                  {garment.cantidad !== undefined && (
                    <li>
                      <strong>Disponibilidad:</strong> {garment.cantidad > 0 ? (
                        <span className="text-green-600 dark:text-green-400 font-semibold">
                          En Stock ({garment.cantidad} unidades)
                        </span>
                      ) : (
                        <span className="text-red-600 dark:text-red-400 font-semibold">
                          Agotado
                        </span>
                      )}
                    </li>
                  )}
                </ul>
              </AccordionItem>
              <AccordionItem
                title="Envíos y Devoluciones"
                isOpen={openAccordion === "shipping"}
                onClick={() => handleAccordionClick("shipping")}
              >
                <p className="leading-relaxed">
                  Ofrecemos envío express a todo el país (24-48 horas).
                  Devoluciones aceptadas dentro de los 7 días posteriores a la
                  recepción, con la prenda en su estado original.
                </p>
              </AccordionItem>
            </div>
          </div>
        </div>

        <div className="flex justify-center items-center py-1 bg-stone-50 dark:bg-stone-800 border-t border-stone-200 dark:border-stone-700">
          <button
            onClick={() => setIsThumbnailStripVisible(!isThumbnailStripVisible)}
            className="p-1 text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 transition-colors rounded-full focus:outline-none focus:ring-2 focus:ring-stone-400 dark:focus:ring-stone-500"
            aria-expanded={isThumbnailStripVisible}
            aria-controls="thumbnail-strip-container"
          >
            <span className="sr-only">
              {isThumbnailStripVisible
                ? "Ocultar miniaturas"
                : "Mostrar miniaturas"}
            </span>
            {isThumbnailStripVisible ? (
              <ChevronUpIcon className="w-6 h-6" />
            ) : (
              <ChevronDownIcon className="w-6 h-6" />
            )}
          </button>
        </div>

        <div
          id="thumbnail-strip-container"
          className={`transition-all duration-300 ease-in-out overflow-hidden ${isThumbnailStripVisible ? "max-h-48" : "max-h-0"}`}
        >
          <ThumbnailStrip
            garments={garmentList}
            currentGarment={garment}
            onSelectGarment={onChangeGarment}
          />
        </div>
      </div>

      <QrCodeModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        garment={garment}
      />


    </div>
  );
};

export default VideoModal;