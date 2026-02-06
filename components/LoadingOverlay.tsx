import React from "react";
import { SpinnerIcon } from "./Icons";

interface LoadingOverlayProps {
  message?: string;
  isOpen?: boolean;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  message = "Cargando...",
  isOpen = true,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 animate-fade-in"
      role="status"
      aria-live="polite"
      aria-label="Cargando"
    >
      <div className="bg-stone-50 rounded-lg shadow-2xl p-8 flex flex-col items-center gap-4 animate-modal-in">
        <SpinnerIcon className="w-12 h-12 text-stone-800 animate-spin" />
        <p className="text-stone-700 font-medium text-lg">{message}</p>
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

export default LoadingOverlay;
