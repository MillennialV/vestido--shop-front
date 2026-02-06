"use client";

import React, { useState, useEffect, useRef } from "react";
import { CloseIcon, EyeIcon, EyeSlashIcon, SpinnerIcon } from "./Icons";

interface AccessCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (email: string, password: string) => Promise<void>;
  error: string | null;
  isLoading?: boolean;
}

const AccessCodeModal: React.FC<AccessCodeModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  error,
  isLoading = false,
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

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    emailRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isLoading) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, isLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (email && password && !isLoading) {
      try {
        await onSubmit(email, password);
      } catch (err) {
        throw err;
      }
    }
  };

  if (!isRendered) return null;

  return (
    <div
      className={`fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 transition-opacity duration-300 ease-in-out ${isVisible ? 'opacity-100' : 'opacity-0'}`}
      onClick={!isLoading ? onClose : undefined}
      role="dialog"
      aria-modal="true"
      aria-labelledby="access-code-modal-title"
    >
      <div
        className={`relative bg-stone-50 dark:bg-stone-800 rounded-lg shadow-2xl w-full max-w-sm transition-all duration-300 ease-in-out ${isVisible ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-4'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className={`p-8 ${isLoading ? "opacity-50 pointer-events-none" : ""}`}
        >
          <h2
            id="access-code-modal-title"
            className="text-2xl font-semibold text-stone-900 dark:text-stone-100 mb-4 text-center"
          >
            Iniciar sesión
          </h2>
          <p className="text-stone-600 dark:text-stone-300 mb-6 text-center">
            Inicia sesión con tu correo y contraseña para continuar.
          </p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-stone-700 dark:text-stone-200 mb-2"
              >
                Correo electrónico
              </label>
              <input
                ref={emailRef}
                type="email"
                name="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className={`w-full p-3 border rounded-md focus:ring-stone-500 dark:focus:ring-stone-400 focus:border-stone-500 dark:focus:border-stone-500 text-base bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 ${error ? "border-red-500 dark:border-red-500" : "border-stone-300 dark:border-stone-600"}`}
                aria-invalid={!!error}
                placeholder="tu@correo.com"
              />
            </div>
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-stone-700 dark:text-stone-200 mb-2"
              >
                Contraseña
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className={`w-full p-3 pr-10 border rounded-md focus:ring-stone-500 dark:focus:ring-stone-400 focus:border-stone-500 dark:focus:border-stone-500 text-base bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 ${error ? "border-red-500 dark:border-red-500" : "border-stone-300 dark:border-stone-600"}`}
                  aria-invalid={!!error}
                  aria-describedby="code-error"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200 transition-colors focus:outline-none focus:ring-2 focus:ring-stone-500 dark:focus:ring-stone-400 rounded"
                  aria-label={
                    showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                  }
                >
                  {showPassword ? (
                    <EyeSlashIcon className="w-5 h-5" />
                  ) : (
                    <EyeIcon className="w-5 h-5" />
                  )}
                </button>
              </div>
              {error && (
                <p
                  id="code-error"
                  className="text-red-600 dark:text-red-400 text-sm mt-2 text-center"
                >
                  {error}
                </p>
              )}
            </div>
            <div className="flex justify-center gap-4 pt-4">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="bg-white dark:bg-stone-700 text-stone-700 dark:text-stone-200 font-medium py-2 px-6 rounded-lg border border-stone-300 dark:border-stone-600 hover:bg-stone-100 dark:hover:bg-stone-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="bg-stone-800 dark:bg-stone-700 text-white font-medium py-2 px-8 rounded-lg hover:bg-stone-700 dark:hover:bg-stone-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Entrar
              </button>
            </div>
          </form>
        </div>
        {!isLoading && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 z-10 transition-colors rounded-full focus:outline-none focus:ring-4 focus:ring-offset-2 focus:ring-stone-500 dark:focus:ring-stone-400"
            aria-label="Cerrar"
          >
            <CloseIcon className="w-6 h-6" />
          </button>
        )}

        {isLoading && (
          <div className="absolute inset-0 bg-stone-50/95 dark:bg-stone-800/95 rounded-lg flex items-center justify-center z-20">
            <div className="flex flex-col items-center gap-4">
              <SpinnerIcon className="w-12 h-12 text-stone-800 dark:text-stone-200 animate-spin" />
              <p className="text-stone-700 dark:text-stone-200 font-medium text-lg">
                Iniciando sesión...
              </p>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};

export default AccessCodeModal;
