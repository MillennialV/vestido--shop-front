"use client";

import React, { useState, useEffect, useRef } from "react";
import type { Garment } from "@/types/Garment";
import QRCode from "qrcode";
import { PUBLIC_URL } from "../lib/seo";
import { slugify } from "../lib/slugify";
import { CloseIcon, DownloadIcon } from "./Icons";

interface QrCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  garment: Garment | null;
}

const QrCodeModal: React.FC<QrCodeModalProps> = ({
  isOpen,
  onClose,
  garment,
}) => {
  const [isRendered, setIsRendered] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

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

  useEffect(() => {
    if (isRendered && garment && canvasRef.current) {
      const currentSlug = garment.slug || slugify(garment.title, garment.id);
      const shareUrl = `${PUBLIC_URL}/#/${currentSlug}`;

      QRCode.toCanvas(
        canvasRef.current,
        shareUrl,
        {
          width: 256,
          margin: 4,
          color: {
            dark: "#000000",
            light: "#ffffff",
          },
        },
        (error) => {
          if (error) {
            console.error("[QrCodeModal] Error al generar QR:", error);
          }
        },
      );
    }
  }, [isRendered, garment, isVisible]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  const handleDownload = () => {
    if (canvasRef.current && garment) {
      const currentSlug = garment.slug || slugify(garment.title, garment.id);
      const link = document.createElement("a");
      link.download = `vestidos-de-fiesta-qr-${currentSlug}.png`;
      link.href = canvasRef.current.toDataURL("image/png");
      link.click();
    }
  };

  if (!isRendered) {
    return null;
  }

  return (
    <div
      className={`fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 transition-opacity duration-300 ease-in-out ${isVisible ? 'opacity-100' : 'opacity-0'}`}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="qr-code-modal-title"
    >
      <div
        className={`relative bg-stone-50 dark:bg-stone-800 rounded-lg shadow-2xl w-full max-w-sm transition-all duration-300 ease-in-out ${isVisible ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-4'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-8 text-center">
          <h2
            id="qr-code-modal-title"
            className="text-2xl font-semibold text-stone-900 dark:text-stone-100 mb-2"
          >
            Compartir con QR
          </h2>
          <p className="text-stone-600 dark:text-stone-300 mb-6">
            {garment?.title}
          </p>
          <div className="flex justify-center mb-6">
            <canvas ref={canvasRef} className="rounded-lg shadow-md"></canvas>
          </div>
          <div className="flex justify-center gap-4">
            <button
              type="button"
              onClick={handleDownload}
              className="inline-flex items-center gap-2 bg-stone-800 dark:bg-stone-700 text-white font-medium py-2 px-6 rounded-lg hover:bg-stone-700 dark:hover:bg-stone-600 transition-colors focus:outline-none focus:ring-4 focus:ring-offset-2 focus:ring-stone-500 dark:focus:ring-stone-400"
            >
              <DownloadIcon className="w-5 h-5" />
              Descargar
            </button>
          </div>
        </div>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 z-10 transition-colors rounded-full focus:outline-none focus:ring-4 focus:ring-offset-2 focus:ring-stone-500 dark:focus:ring-stone-400"
          aria-label="Cerrar"
        >
          <CloseIcon className="w-6 h-6" />
        </button>
      </div>

    </div>
  );
};

export default QrCodeModal;
