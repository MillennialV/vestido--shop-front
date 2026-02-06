"use client";

import React, { useState, useEffect } from "react";
import { WhatsappIcon, CloseIcon } from "./Icons";

interface WhatsappModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const WhatsappModal: React.FC<WhatsappModalProps> = ({ isOpen, onClose }) => {
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

  const [whatsappNumber, setWhatsappNumber] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("whatsappNumber");
      const fullNumber = saved || "51956382746";
      // Si el número guardado empieza con 51, extraer solo la parte local
      return fullNumber.startsWith("51") ? fullNumber.substring(2) : fullNumber;
    }
    return "956382746"; // Default local number without prefix
  });

  useEffect(() => {
    const storedNumber = localStorage.getItem("whatsappNumber");
    if (storedNumber) {
      setWhatsappNumber(storedNumber);
    }
  }, [isOpen]);

  if (!isRendered) return null;

  const handleWhatsappNumberChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const value = e.target.value.replace(/\D/g, ""); // Solo números
    if (value.length <= 9) {
      setWhatsappNumber(value);
    }
  };

  const handleSaveWhatsappNumber = () => {
    localStorage.setItem("whatsappNumber", whatsappNumber);
    onClose();
    // Opcional: Mostrar una notificación de éxito o recargar el contexto si es necesario
  };

  return (
    <div
      className={`fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 transition-opacity duration-300 ease-in-out ${isVisible ? 'opacity-100' : 'opacity-0'}`}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="whatsapp-modal-title"
    >
      <div
        className={`relative bg-stone-50 dark:bg-stone-800 rounded-lg shadow-2xl w-full max-w-sm transition-all duration-300 ease-in-out ${isVisible ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-4'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-8">
          <div className="flex items-center justify-between mb-4">
            <h2
              id="whatsapp-modal-title"
              className="text-2xl font-semibold !font-sans text-stone-900 dark:text-stone-100 flex items-center gap-2"
            >
              <WhatsappIcon className="w-6 h-6 text-[#25D366]" />
              Registra el número
            </h2>
            <button
              onClick={onClose}
              className="text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300 transition-colors"
              aria-label="Cerrar"
            >
              <CloseIcon className="w-6 h-6" />
            </button>
          </div>
          <p className="text-stone-600 dark:text-stone-300 mb-6">
            Ingresa el número de WhatsApp que se usará para las consultas.
          </p>
          <div className="space-y-4">
            <div>
              <label
                htmlFor="whatsapp-number-input"
                className="block text-sm font-semibold text-stone-700 dark:text-stone-200 mb-2"
              >
                Número de WhatsApp
              </label>
              <div className="flex items-center">
                <span className="px-4 py-2.5 bg-stone-100 dark:bg-stone-700 border border-r-0 border-stone-300 dark:border-stone-600 rounded-l-lg text-sm font-semibold text-stone-700 dark:text-stone-200">
                  +51
                </span>
                <input
                  id="whatsapp-number-input"
                  type="text"
                  value={whatsappNumber}
                  onChange={handleWhatsappNumberChange}
                  placeholder="956382746"
                  maxLength={9}
                  className="flex-1 px-4 py-2.5 border border-stone-300 dark:border-stone-600 rounded-r-lg focus:outline-none focus:ring-2 focus:ring-[#25D366] focus:border-transparent text-sm font-sans bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100"
                />
              </div>
              <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
                Ingresa solo el número local (9 dígitos)
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 bg-white dark:bg-stone-700 text-stone-700 dark:text-stone-200 font-semibold py-2.5 px-4 rounded-lg border border-stone-300 dark:border-stone-600 hover:bg-stone-100 dark:hover:bg-stone-600 transition-colors text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveWhatsappNumber}
                disabled={whatsappNumber.trim().length < 9}
                className="flex-1 bg-[#25D366] text-white font-semibold py-2.5 px-4 rounded-lg hover:bg-[#20BA5A] active:bg-[#1DA851] transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WhatsappModal;
