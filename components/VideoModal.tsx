"use client";

import React, { useEffect, useRef, useState } from "react";
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
} from "./Icons";

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
    // Reset video loading state only when video URL changes (not on every render)
    setIsVideoLoading(true);
    setVideoError(null);
  }, [garment?.videoUrl]);

  const handleShare = () => {
    if (!garment) return;
    const currentSlug = garment.slug || slugify(garment.title, garment.id);
    const shareUrl = `${PUBLIC_URL}/#/${currentSlug}`;
    navigator.clipboard
      .writeText(shareUrl)
      .then(() => {
        setToastMessage("¡Enlace copiado!");
        setTimeout(() => setToastMessage(null), 3000);
      })
      .catch((err) => {
        console.error("Failed to copy link: ", err);
        setToastMessage("Error al copiar el enlace.");
        setTimeout(() => setToastMessage(null), 3000);
      });
  };

  const handleSocialShare = async (platform: "TikTok" | "Instagram") => {
    if (!garment?.videoUrl || !garment?.title || !garment?.brand) return;

    const fileName = `vestidos-de-fiesta-${garment.title.toLowerCase().replace(/\s+/g, "-")}.mp4`;
    const shareDetails = {
      title: `${garment.title} - Colección Vestidos de Fiesta`,
      text: `Descubre este vestido de la nueva colección de Vestidos de Fiesta por Womanity Boutique. #VestidosDeFiesta #WomanityBoutique #ModaDeLujo #${garment.brand.replace(/\s+/g, "")}`,
    };

    try {
      const response = await fetch(garment.videoUrl);
      if (!response.ok) {
        throw new Error(
          `La respuesta de la red no fue correcta, estado: ${response.status}`,
        );
      }
      const blob = await response.blob();
      const file = new File([blob], fileName, { type: "video/mp4" });

      if (
        navigator.share &&
        navigator.canShare &&
        navigator.canShare({ files: [file] })
      ) {
        await navigator.share({ ...shareDetails, files: [file] });
      } else {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.style.display = "none";
        a.href = url;
        a.download = fileName;

        document.body.appendChild(a);
        a.click();

        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        setToastMessage(
          `¡Video descargado! Súbelo a ${platform} para publicarlo.`,
        );
        setTimeout(() => setToastMessage(null), 4000);
      }
    } catch (error: any) {
      if (error.name !== "AbortError") {
        console.error(
          `Error al compartir/descargar el video para ${platform}:`,
          error,
        );
        setToastMessage("No se pudo compartir o descargar.");
        setTimeout(() => setToastMessage(null), 4000);
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
          {/* Video - Sticky on desktop, scrollable on mobile */}
          <div className="relative w-full md:w-1/2 md:sticky md:top-0 aspect-[9/16] bg-black flex items-center justify-center flex-shrink-0 overflow-hidden">
            {isVideoLoading && (
              <div className="absolute inset-0 flex items-center justify-center z-10 bg-black/50">
                <SpinnerIcon className="w-10 h-10 text-white animate-spin" />
              </div>
            )}
            {videoError && (
              <div className="absolute inset-0 flex items-center justify-center z-10 bg-black/80">
                <div className="text-center text-white">
                  <p className="text-lg font-semibold mb-2">
                    Error al cargar el video
                  </p>
                  <p className="text-sm">{videoError}</p>
                </div>
              </div>
            )}
            {garment.videoUrl ? (
              <video
                ref={videoRef}
                key={garment.videoUrl}
                src={garment.videoUrl}
                autoPlay
                loop
                muted
                controls
                playsInline
                preload="auto"
                onCanPlay={handleVideoCanPlay}
                onError={handleVideoError}
                onLoadStart={handleVideoLoadStart}
                title={`Video de demostración para ${garment.title} por ${garment.brand}`}
                className="w-full h-full object-contain"
              >
              </video>
            ) : (
              <div className="text-white text-center">
                <p>No hay video disponible para este producto</p>
              </div>
            )}
            <div className="absolute bottom-4 right-4 z-10 flex flex-col items-center gap-3">
              <button
                onClick={() => setIsQrModalOpen(true)}
                className="flex flex-col items-center text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white rounded-full p-1 group"
                aria-label="Mostrar código QR"
              >
                <span className="bg-black opacity-50 backdrop-blur-2xl rounded-full p-3 shadow-lg">
                  <QrCodeIcon className="w-6 h-6 text-white" />
                </span>
                <span className="text-xs font-semibold text-white drop-shadow-lg mt-1.5">
                  QR
                </span>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleSocialShare("TikTok");
                }}
                className="flex flex-col items-center text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white rounded-full p-1 group"
                aria-label="Publicar en TikTok"
              >
                <span className="bg-black opacity-50 backdrop-blur-2xl rounded-full p-3 shadow-lg">
                  <TikTokIcon className="w-6 h-6 text-white" />
                </span>
                <span className="text-xs font-semibold text-white drop-shadow-lg mt-1.5">
                  TikTok
                </span>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleSocialShare("Instagram");
                }}
                className="flex flex-col items-center text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white rounded-full p-1 group"
                aria-label="Publicar en Instagram"
              >
                <span className="bg-black opacity-50 backdrop-blur-2xl rounded-full p-3 shadow-lg">
                  <InstagramIcon className="w-6 h-6 text-white" />
                </span>
                <span className="text-xs font-semibold text-white drop-shadow-lg mt-1.5">
                  Instagram
                </span>
              </button>
              <button
                onClick={handleShare}
                className="flex flex-col items-center text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white rounded-full p-1 group"
                aria-label="Copiar enlace de la prenda"
              >
                <span className="bg-black opacity-50 backdrop-blur-2xl rounded-full p-3 shadow-lg">
                  <ShareIcon className="w-6 h-6 text-white" />
                </span>
                <span className="text-xs font-semibold text-white drop-shadow-lg mt-1.5">
                  Compartir
                </span>
              </button>
            </div>
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
