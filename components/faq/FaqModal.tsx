/**
 * Componente modal reutilizable para gestionar preguntas frecuentes (FAQ)
 *
 * Soporta tres modos de operación:
 * - create: Crear nueva pregunta (solo pregunta y respuesta, estado "activa" automático)
 * - edit: Editar pregunta existente (solo pregunta y respuesta)
 * - delete: Eliminar pregunta con confirmación
 *
 * Características:
 * - Validación de campos con mensajes de error específicos por campo
 * - Manejo de errores HTTP (401, 404, 422, 500)
 * - Estados de carga durante operaciones
 * - Limpieza automática de errores al escribir
 */

"use client";

import React, { useState, useEffect, useRef } from "react";
// Eliminado preguntasService y PreguntasServiceError
import type { FaqItem } from "@/types/FaqItem";
import { CloseIcon, SpinnerIcon, ExclamationTriangleIcon } from "@/components/ui/Icons";

type FaqModalMode = "create" | "edit" | "delete";

interface FaqModalProps {
  isOpen: boolean;
  mode: FaqModalMode;
  faq?: FaqItem | null;
  onClose: () => void;
  onSuccess: () => void;
}

interface ValidationError {
  field: string;
  message: string;
}

const FaqModal: React.FC<FaqModalProps> = ({
  isOpen,
  mode,
  faq,
  onClose,
  onSuccess,
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

  const [pregunta, setPregunta] = useState("");
  const [respuesta, setRespuesta] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const preguntaRef = useRef<HTMLInputElement>(null);
  const respuestaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (mode === "edit" && faq) {
      setPregunta(faq.pregunta);
      setRespuesta(faq.respuesta);
    } else {
      setPregunta("");
      setRespuesta("");
    }
    setError(null);
    setFieldErrors({});
  }, [mode, faq]);

  useEffect(() => {
    if (mode === "create" || mode === "edit") {
      preguntaRef.current?.focus();
    }
  }, [mode]);

  useEffect(() => {
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

  /**
   * Parsea los errores de validación del backend a un formato estructurado
   * Soporta múltiples formatos de respuesta del servidor
   */
  const parseValidationErrors = (errorData: any): Record<string, string> => {
    const errors: Record<string, string> = {};

    if (Array.isArray(errorData)) {
      errorData.forEach((err: ValidationError) => {
        if (err.field && err.message) {
          errors[err.field] = err.message;
        }
      });
    } else if (errorData.errors && Array.isArray(errorData.errors)) {
      errorData.errors.forEach((err: ValidationError) => {
        if (err.field && err.message) {
          errors[err.field] = err.message;
        }
      });
    } else if (errorData.validation) {
      Object.keys(errorData.validation).forEach((field) => {
        errors[field] = errorData.validation[field];
      });
    }

    return errors;
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const newFieldErrors: Record<string, string> = {};
    const trimmedPregunta = pregunta.trim();
    const trimmedRespuesta = respuesta.trim();

    if (trimmedPregunta.length < 10) {
      newFieldErrors.pregunta = "La pregunta debe tener al menos 10 caracteres";
    }
    if (!trimmedRespuesta) {
      newFieldErrors.respuesta = "La respuesta es requerida";
    } else if (trimmedRespuesta.length < 20) {
      newFieldErrors.respuesta = "La respuesta debe tener al menos 20 caracteres";
    }

    if (Object.keys(newFieldErrors).length > 0) {
      setFieldErrors(newFieldErrors);
      setError("Por favor corrige los errores antes de continuar");
      return;
    }

    setIsLoading(true);
    setError(null);
    setFieldErrors({});

    try {
      const res = await fetch('/api/faqs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pregunta: pregunta.trim(),
          respuesta: respuesta.trim(),
          estado: 'activa',
        }),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        if (res.status === 401) {
          setError('No estás autenticado. Inicia sesión primero.');
        } else if (res.status === 422) {
          const validationErrors = parseValidationErrors(errorData);
          if (Object.keys(validationErrors).length > 0) {
            setFieldErrors(validationErrors);
            setError('Por favor corrige los errores en el formulario');
          } else {
            setError('Error de validación. Verifica los datos ingresados.');
          }
        } else {
          setError(errorData.error || errorData.message || 'Error al crear la pregunta');
        }
        return;
      }
      onSuccess();
      onClose();
    } catch (err) {
      setError('Error desconocido al crear la pregunta');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!faq) return;
    
    const newFieldErrors: Record<string, string> = {};
    const trimmedPregunta = pregunta.trim();
    const trimmedRespuesta = respuesta.trim();

    if (trimmedPregunta.length < 10) {
      newFieldErrors.pregunta = "La pregunta debe tener al menos 10 caracteres";
    }
    if (!trimmedRespuesta) {
      newFieldErrors.respuesta = "La respuesta es requerida";
    } else if (trimmedRespuesta.length < 20) {
      newFieldErrors.respuesta = "La respuesta debe tener al menos 20 caracteres";
    }

    if (Object.keys(newFieldErrors).length > 0) {
      setFieldErrors(newFieldErrors);
      setError("Por favor corrige los errores antes de continuar");
      return;
    }

    setIsLoading(true);
    setError(null);
    setFieldErrors({});

    try {
      const res = await fetch('/api/faqs', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: faq.id,
          pregunta: pregunta.trim(),
          respuesta: respuesta.trim(),
        }),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        if (res.status === 401) {
          setError('No estás autenticado. Inicia sesión primero.');
        } else if (res.status === 404) {
          setError('La pregunta no existe');
        } else if (res.status === 422) {
          const validationErrors = parseValidationErrors(errorData);
          if (Object.keys(validationErrors).length > 0) {
            setFieldErrors(validationErrors);
            setError('Por favor corrige los errores en el formulario');
          } else {
            setError('Error de validación. Verifica los datos ingresados.');
          }
        } else {
          setError(errorData.error || errorData.message || 'Error al actualizar la pregunta');
        }
        return;
      }
      onSuccess();
      onClose();
    } catch (err) {
      setError('Error desconocido al actualizar la pregunta');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!faq) return;

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/faqs', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: faq.id }),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        if (res.status === 401) {
          setError('No estás autenticado. Inicia sesión primero.');
        } else if (res.status === 404) {
          setError('La pregunta no existe');
        } else {
          setError(errorData.error || errorData.message || 'Error al eliminar la pregunta');
        }
        return;
      }
      onSuccess();
      onClose();
    } catch (err) {
      setError('Error desconocido al eliminar la pregunta');
    } finally {
      setIsLoading(false);
    }
  };

  const getTitle = () => {
    switch (mode) {
      case "create":
        return "Agregar Pregunta";
      case "edit":
        return "Editar Pregunta";
      case "delete":
        return "Eliminar Pregunta";
      default:
        return "";
    }
  };

  if (!isRendered) return null;

  return (
    <div
      className={`fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 transition-opacity duration-300 ease-in-out ${isVisible ? 'opacity-100' : 'opacity-0'}`}
      onClick={!isLoading ? onClose : undefined}
      role="dialog"
      aria-modal="true"
      aria-labelledby="faq-modal-title"
    >
      <div
        className={`relative bg-stone-50 dark:bg-[#1a1a1a] rounded-lg shadow-2xl w-full max-w-lg transition-all duration-300 ease-in-out ${isVisible ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-4'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className={`p-8 ${isLoading ? "opacity-50 pointer-events-none" : ""}`}
        >
          <h2
            id="faq-modal-title"
            className="text-2xl font-semibold text-stone-900 dark:text-white mb-6"
          >
            {getTitle()}
          </h2>

          {error && (
            <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-md">
              <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
            </div>
          )}

          {mode === "delete" ? (
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <ExclamationTriangleIcon className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-stone-700 dark:text-stone-200 mb-2">
                    ¿Estás seguro de que quieres eliminar esta pregunta?
                  </p>
                  {faq && (
                    <div className="bg-stone-100 dark:bg-[#0f0f0f] p-4 rounded-md">
                      <p className="font-semibold text-stone-900 dark:text-white mb-2">
                        {faq.pregunta}
                      </p>
                      <p className="text-sm text-stone-600 dark:text-[#a0a0a0] line-clamp-2">
                        {faq.respuesta}
                      </p>
                    </div>
                  )}
                  <p className="text-sm text-stone-600 dark:text-stone-400 mt-3">
                    Esta acción no se puede deshacer.
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  aria-label="Cancelar"
                  onClick={onClose}
                  disabled={isLoading}
                  className="bg-color-four dark:bg-[#0f0f0f] text-color-three/80 dark:text-[#a0a0a0] font-medium py-2.5 px-6 rounded-lg border border-color-three/20 dark:border-[#2a2a2a] hover:bg-color-three/5 dark:hover:bg-[#2a2a2a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-sm"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  aria-label="Eliminar"
                  onClick={handleDelete}
                  disabled={isLoading}
                  className="bg-red-600 dark:bg-red-700 text-white font-medium py-2.5 px-6 rounded-lg hover:bg-red-700 dark:hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <SpinnerIcon className="w-4 h-4 animate-spin" />
                      Eliminando...
                    </>
                  ) : (
                    "Eliminar"
                  )}
                </button>
              </div>
            </div>
          ) : (
            <form
              onSubmit={mode === "create" ? handleCreate : handleEdit}
              className="space-y-4"
            >
              <div>
                <label
                  htmlFor="pregunta"
                  className="block text-sm font-medium text-stone-700 dark:text-stone-200 mb-2"
                >
                  Pregunta
                </label>
                <input
                  ref={preguntaRef}
                  type="text"
                  id="pregunta"
                  value={pregunta}
                  onChange={(e) => {
                    setPregunta(e.target.value);
                    if (fieldErrors.pregunta) {
                      setFieldErrors((prev) => {
                        const newErrors = { ...prev };
                        delete newErrors.pregunta;
                        return newErrors;
                      });
                    }
                  }}
                  required
                  disabled={isLoading}
                  className={`w-full p-3 border rounded-md focus:ring-stone-500 dark:focus:ring-white focus:border-stone-500 dark:focus:border-[#2a2a2a] text-base bg-white dark:bg-[#0f0f0f] text-stone-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed ${fieldErrors.pregunta
                    ? "border-red-500 dark:border-red-500"
                    : "border-stone-300 dark:border-[#2a2a2a]"
                    }`}
                  placeholder="Ej: ¿Cómo puedo saber cuál es mi talla correcta?"
                />
                {fieldErrors.pregunta && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {fieldErrors.pregunta}
                  </p>
                )}
              </div>
              <div>
                <label
                  htmlFor="respuesta"
                  className="block text-sm font-medium text-stone-700 dark:text-stone-200 mb-2"
                >
                  Respuesta
                </label>
                <textarea
                  ref={respuestaRef}
                  id="respuesta"
                  value={respuesta}
                  onChange={(e) => {
                    setRespuesta(e.target.value);
                    if (fieldErrors.respuesta) {
                      setFieldErrors((prev) => {
                        const newErrors = { ...prev };
                        delete newErrors.respuesta;
                        return newErrors;
                      });
                    }
                  }}
                  required
                  disabled={isLoading}
                  rows={5}
                  className={`w-full p-3 border rounded-md focus:ring-stone-500 dark:focus:ring-white focus:border-stone-500 dark:focus:border-[#2a2a2a] text-base bg-white dark:bg-[#0f0f0f] text-stone-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed resize-y ${fieldErrors.respuesta
                    ? "border-red-500 dark:border-red-500"
                    : "border-stone-300 dark:border-[#2a2a2a]"
                    }`}
                  placeholder="Escribe la respuesta a la pregunta..."
                />
                {fieldErrors.respuesta && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {fieldErrors.respuesta}
                  </p>
                )}
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  aria-label="Cancelar"
                  onClick={onClose}
                  disabled={isLoading}
                  className="bg-color-four dark:bg-[#0f0f0f] text-color-three/80 dark:text-[#a0a0a0] font-medium py-2.5 px-6 rounded-lg border border-color-three/20 dark:border-[#2a2a2a] hover:bg-color-three/5 dark:hover:bg-[#2a2a2a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-sm"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  aria-label="Guardar"
                  disabled={isLoading}
                   className="bg-color-three dark:bg-white text-color-four dark:text-[#0f0f0f] font-medium py-2.5 px-6 rounded-lg hover:opacity-90 active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer shadow-md"
                >
                  {isLoading ? (
                    <>
                      <SpinnerIcon className="w-4 h-4 animate-spin" />
                      {mode === "create" ? "Creando..." : "Guardando..."}
                    </>
                  ) : mode === "create" ? (
                    "Crear"
                  ) : (
                    "Guardar"
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
        {!isLoading && (
          <button
            type="button"
            aria-label="Cerrar"
            onClick={onClose}
            className="absolute top-4 right-4 text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 z-10 transition-colors rounded-full focus:outline-none focus:ring-4 focus:ring-offset-2 focus:ring-stone-500 dark:focus:ring-stone-400 cursor-pointer disabled:cursor-not-allowed"
          >
            <CloseIcon className="w-6 h-6" />
          </button>
        )}
        {isLoading && (
          <div className="absolute inset-0 bg-stone-50/95 dark:bg-[#1a1a1a]/95 rounded-lg flex items-center justify-center z-20">
            <div className="flex flex-col items-center gap-4">
              <SpinnerIcon className="w-12 h-12 text-stone-800 dark:text-stone-200 animate-spin" />
              <p className="text-stone-700 dark:text-stone-200 font-medium text-lg">
                {mode === "create"
                  ? "Creando pregunta..."
                  : mode === "edit"
                    ? "Guardando cambios..."
                    : "Eliminando pregunta..."}
              </p>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};

export default FaqModal;
