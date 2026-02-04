"use client";

import React, { useEffect, useRef } from "react";
import type { Garment } from "@/types/Garment";
import QRCode from "qrcode";
import { PUBLIC_URL } from "../lib/seo";
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
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (isOpen && garment && garment.slug && canvasRef.current) {
      const shareUrl = `${PUBLIC_URL}/#/${garment.slug}`;

      QRCode.toCanvas(
        canvasRef.current,
        shareUrl,
        {
          width: 256,
          margin: 2,
          color: {
            dark: "#292524", // stone-800
            light: "#fafaf9", // stone-50
          },
        },
        (error) => {
          if (error) {
            console.error("Failed to generate QR Code:", error);
          }
        },
      );
    }
  }, [isOpen, garment]);

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
      const link = document.createElement("a");
      link.download = `vestidos-de-fiesta-qr-${garment.slug}.png`;
      link.href = canvasRef.current.toDataURL("image/png");
      link.click();
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="qr-code-modal-title"
    >
      <div
        className="relative bg-stone-50 dark:bg-stone-800 rounded-lg shadow-2xl w-full max-w-sm animate-modal-in"
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
      <style>{`
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
        @keyframes modal-in {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-modal-in { animation: modal-in 0.3s ease-out forwards; }
      `}</style>
    </div>
  );
};

export default QrCodeModal;
