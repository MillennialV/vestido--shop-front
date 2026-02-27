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
      const shareUrl = `${PUBLIC_URL}/${currentSlug}`;

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
      className={`fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity duration-300 ease-in-out ${isVisible ? 'opacity-100' : 'opacity-0'}`}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="qr-code-modal-title"
    >
      <div
        className={`relative w-full max-w-[340px] transition-all duration-300 ease-in-out ${isVisible ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-4'}`}
        onClick={(e) => e.stopPropagation()}
        style={{ filter: "drop-shadow(0 25px 50px rgba(0,0,0,0.25))" }}
      >
        <div
          className="relative bg-color-four dark:bg-color-three w-full pt-12 pb-12 px-6 flex flex-col items-center"
          style={{
            maskImage: `radial-gradient(circle at top left, transparent 40px, black 41px),
                        radial-gradient(circle at top right, transparent 40px, black 41px),
                        radial-gradient(circle at bottom left, transparent 40px, black 41px),
                        radial-gradient(circle at bottom right, transparent 40px, black 41px)`,
            maskSize: "51% 51%",
            maskRepeat: "no-repeat",
            maskPosition: "top left, top right, bottom left, bottom right",
            WebkitMaskImage: `radial-gradient(circle at top left, transparent 40px, black 41px),
                              radial-gradient(circle at top right, transparent 40px, black 41px),
                              radial-gradient(circle at bottom left, transparent 40px, black 41px),
                              radial-gradient(circle at bottom right, transparent 40px, black 41px)`,
            WebkitMaskSize: "51% 51%",
            WebkitMaskRepeat: "no-repeat",
            WebkitMaskPosition: "top left, top right, bottom left, bottom right",
          }}
        >
          <h2
            id="qr-code-modal-title"
            className="text-[20px] font-inter font-semibold height-[100%] spacing-[0%] text-color-three dark:text-color-four mb-2 "
          >
            Compartir con QR
          </h2>
          <p className="text-[15px] font-inter font-normal height-[100%] spacing-[0%] text-color-three dark:text-color-four mb-8 text-center">
            {garment?.title}
          </p>

          <div className="bg-white p-3 rounded-[24px] shadow-sm mb-10 w-full max-w-[240px] aspect-square flex items-center justify-center overflow-hidden">
            <canvas ref={canvasRef} className="w-full h-full"></canvas>
          </div>

          <button
            type="button"
            onClick={handleDownload}
            className="w-[180px] h-[52px] bg-color-three dark:bg-color-four text-color-four dark:text-color-three font-medium rounded-[16px] hover:bg-color-three dark:hover:bg-color-four transition-colors focus:outline-none focus:ring-4 focus:ring-offset-2 focus:ring-stone-500 dark:focus:ring-stone-400 font-inter text-[15px] flex items-center justify-center gap-2"
          >
            <DownloadIcon className="w-5 h-5" />
            Descargar
          </button>
        </div>
      </div>
    </div>
  );
};

export default QrCodeModal;
