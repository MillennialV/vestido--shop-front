"use client";

import React, { useState, useRef } from "react";
import type { Garment } from "@/types/Garment";
import { saveBulkGarments } from "../lib/db";
// import { iaService } from "../services/iaService";
import { getFriendlySupabaseError } from "../lib/errorUtils";
import {
  CloseIcon,
  UploadIcon,
  SpinnerIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  SparklesIcon,
} from "./Icons";

interface BulkUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBulkSaveComplete: (newGarments: Garment[]) => void;
}

type UploadStatus =
  | "pending"
  | "uploading"
  | "processing"
  | "completed"
  | "error";

interface UploadableFile {
  id: string;
  file: File;
  previewUrl: string;
  status: UploadStatus;
  progress: number;
  errorMessage?: string;
  garmentData: {
    title: string;
    brand: string;
    description: string;
    size: string;
    color: string;
    price: string;
    material: string;
    occasion: string;
    style_notes: string;
    cantidad: string;
  };
  videoUrl?: string;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  validationErrors?: {
    [key: string]: string;
  };
}

const BulkUploadModal: React.FC<BulkUploadModalProps> = ({
  isOpen,
  onClose,
  onBulkSaveComplete,
}) => {
  const [isRendered, setIsRendered] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [files, setFiles] = useState<UploadableFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setIsRendered(true);
      setTimeout(() => setIsVisible(true), 10);
    } else {
      setIsVisible(false);
      const timer = setTimeout(() => {
        setIsRendered(false);
        // Reset state when modal is completely hidden
        if (files.length > 0) {
          files.forEach(f => URL.revokeObjectURL(f.previewUrl));
        }
        setFiles([]);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isRendered) return null;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles) return;
    const newFiles: UploadableFile[] = Array.from(selectedFiles)
      .filter((file) => file.type.startsWith("video/"))
      .map((file) => ({
        id: crypto.randomUUID(),
        file,
        previewUrl: URL.createObjectURL(file),
        status: "pending",
        progress: 0,
        garmentData: {
          title: file.name.replace(/\.[^/.]+$/, ""),
          brand: "",
          description: "",
          size: "M",
          color: "",
          price: "",
          material: "",
          occasion: "",
          style_notes: "",
          cantidad: "1",
        },
        videoRef: React.createRef<HTMLVideoElement>(),
      }));
    setFiles((prev) => [...prev, ...newFiles]);

    // Limpiar el valor del input para permitir volver a seleccionar el mismo archivo si se elimina
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemoveFile = (id: string) => {
    const fileToRemove = files.find((f) => f.id === id);
    if (fileToRemove) {
      URL.revokeObjectURL(fileToRemove.previewUrl);
    }
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const updateFileState = (id: string, updates: Partial<UploadableFile>) => {
    setFiles((prev) =>
      prev.map((f) => (f.id === id ? { ...f, ...updates } : f)),
    );
  };

  const handleInputChange = (
    id: string,
    field: keyof UploadableFile["garmentData"],
    value: string,
  ) => {
    setFiles((prev) =>
      prev.map((f) => {
        if (f.id === id) {
          return { ...f, garmentData: { ...f.garmentData, [field]: value } };
        }
        return f;
      }),
    );
  };

  // Función helper para capturar un frame del video
  const captureFrame = (videoEl: HTMLVideoElement): Promise<string> => {
    return new Promise((resolve, reject) => {
      const onSeeked = () => {
        videoEl.removeEventListener("seeked", onSeeked);
        const canvas = document.createElement("canvas");
        canvas.width = videoEl.videoWidth;
        canvas.height = videoEl.videoHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx)
          return reject(new Error("No se pudo obtener el contexto del canvas"));

        ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
        try {
          const base64ImageData = canvas.toDataURL("image/jpeg").split(",")[1];
          resolve(base64ImageData);
        } catch (e) {
          reject(e);
        }
      };

      videoEl.addEventListener("seeked", onSeeked, { once: true });
      videoEl.addEventListener(
        "error",
        (e) => reject(new Error(`Error en el elemento de video: ${e}`)),
        { once: true },
      );

      videoEl.currentTime = Math.min(1, videoEl.duration / 2);
    });
  };

  const processQueue = async () => {
    setIsProcessing(true);

    // Obtenemos solo los que están pendientes o en error para reintentar
    const pendingFiles = files.filter(f => f.status === "pending" || f.status === "error");

    for (const file of pendingFiles) {
      try {
        // Analizar con IA (No necesitamos subir el video primero, usamos el elemento local)
        updateFileState(file.id, { status: "processing", errorMessage: undefined });

        const videoElement = file.videoRef.current;
        if (!videoElement) {
          throw new Error("El elemento de video no está disponible para captura.");
        }

        // Asegurar que el video intente cargar si no lo ha hecho
        if (videoElement.readyState < 2) {
          videoElement.load();
          await new Promise((resolve, reject) => {
            const handleLoaded = () => {
              videoElement.removeEventListener("loadeddata", handleLoaded);
              resolve(true);
            };
            const handleError = () => {
              videoElement.removeEventListener("error", handleError);
              reject(new Error("Error al cargar los datos del video para análisis."));
            };
            videoElement.addEventListener("loadeddata", handleLoaded);
            videoElement.addEventListener("error", handleError);
            // Timeout de 15 segundos para carga de video local (debería ser instantáneo)
            setTimeout(() => reject(new Error("Timeout cargando video local.")), 15000);
          });
        }

        // Capturar un frame del video
        const base64Image = await captureFrame(videoElement);

        // Llamar al API route de Next.js para análisis de prenda
        const response = await fetch("/api/ia/analyze-garment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageBase64: base64Image }),
        });

        if (!response.ok) {
          throw new Error("Error al analizar la prenda con IA");
        }

        const result = await response.json();

        // Actualizar los datos de la prenda con la información de IA
        setFiles((prev) =>
          prev.map((f) => {
            if (f.id === file.id) {
              const updatedData = { ...f.garmentData };
              const newPrice = result.price;
              let priceString = updatedData.price;

              if (typeof newPrice === "number" && !isNaN(newPrice) && newPrice > 0) {
                priceString = String(newPrice);
              }

              // Update fields if they are empty or if the title is still the default (filename)
              const isDefaultTitle = updatedData.title === file.file.name.replace(/\.[^/.]+$/, "");

              if ((!updatedData.title || isDefaultTitle) && result.title) {
                updatedData.title = result.title;
              }
              if (!updatedData.brand && result.brand) updatedData.brand = result.brand;
              if (!updatedData.description && result.description) updatedData.description = result.description;
              if (!updatedData.color && result.color) updatedData.color = result.color;
              if (!updatedData.price && priceString) updatedData.price = priceString;
              if (!updatedData.material && result.material) updatedData.material = result.material;
              if (!updatedData.occasion && result.occasion) updatedData.occasion = result.occasion;
              if (!updatedData.style_notes && result.style_notes) updatedData.style_notes = result.style_notes;
              if (!updatedData.size && result.size) updatedData.size = result.size;

              return { ...f, garmentData: updatedData, status: "completed" as UploadStatus };
            }
            return f;
          }),
        );

      } catch (error: any) {
        updateFileState(file.id, {
          status: "error",
          errorMessage: error instanceof Error ? error.message : String(error)
        });
      }
    }
    setIsProcessing(false);
  };

  const handleSaveAll = async () => {
    // Una prenda está lista para el proceso de guardado si tiene campos obligatorios: título, marca, talla y color
    const filesToProcess = files.filter((f) =>
      f.garmentData.title &&
      f.garmentData.brand &&
      f.garmentData.size &&
      f.garmentData.color
    );

    if (filesToProcess.length === 0) {
      return;
    }

    setIsSaving(true);

    try {
      const savedGarments: Garment[] = [];

      for (const f of filesToProcess) {
        try {
          let response;

          // Si ya tenemos una videoUrl (por la IA), enviamos JSON
          if (f.videoUrl) {
            response = await fetch("/api/products", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                ...f.garmentData,
                price: f.garmentData.price ? parseFloat(f.garmentData.price) : undefined,
                cantidad: f.garmentData.cantidad ? parseInt(f.garmentData.cantidad, 10) : 0,
                videoUrl: f.videoUrl,
              }),
            });
          }
          // Si no tenemos URL, enviamos Multipart (Archivo + Datos) en una sola petición
          else {
            const formData = new FormData();
            formData.append("video", f.file);
            formData.append("title", f.garmentData.title);
            formData.append("brand", f.garmentData.brand);
            formData.append("description", f.garmentData.description);
            formData.append("size", f.garmentData.size);
            formData.append("color", f.garmentData.color);
            if (f.garmentData.price) formData.append("price", f.garmentData.price);
            formData.append("material", f.garmentData.material);
            formData.append("occasion", f.garmentData.occasion);
            formData.append("style_notes", f.garmentData.style_notes);
            formData.append("cantidad", f.garmentData.cantidad || "0");

            response = await fetch("/api/products", {
              method: "POST",
              body: formData,
            });
          }

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const backendError = errorData.message || errorData.error || `Error al guardar "${f.garmentData.title}"`;

            // Si hay errores específicos por campo, los mapeamos
            const fieldErrors: { [key: string]: string } = {};
            if (Array.isArray(errorData.errors)) {
              errorData.errors.forEach((err: { field: string, message: string }) => {
                fieldErrors[err.field] = err.message;
              });
            }

            updateFileState(f.id, {
              status: "error",
              errorMessage: backendError,
              validationErrors: fieldErrors
            });
            continue; // Seguimos con el siguiente producto
          }

          const savedProduct = await response.json();
          savedGarments.push(savedProduct);

          // Marcamos como completado en la UI
          updateFileState(f.id, { status: "completed", errorMessage: undefined, validationErrors: undefined });
        } catch (individualError: any) {
          updateFileState(f.id, {
            status: "error",
            errorMessage: individualError.message || "Error inesperado al guardar"
          });
        }
      }

      if (savedGarments.length > 0) {
        onBulkSaveComplete(savedGarments);
      }
    } catch (error: any) {
      console.error("Failed to save bulk garments:", error);
      // Solo mostramos alerta para errores catastróficos, no de validación individual
    } finally {
      setIsSaving(false);
    }
  };

  const readyToSaveCount = files.filter((f) =>
    f.garmentData.title &&
    f.garmentData.brand &&
    f.garmentData.size &&
    f.garmentData.color
  ).length;
  const pendingCount = files.filter((f) => f.status === "pending" || f.status === "error").length;

  return (
    <div
      className={`fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 transition-opacity duration-300 ease-in-out ${isVisible ? 'opacity-100' : 'opacity-0'}`}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="bulk-upload-title"
    >
      <div
        className={`relative bg-stone-50 dark:bg-stone-900 rounded-lg shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col transition-all duration-300 ease-in-out ${isVisible ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-8'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="p-6 border-b border-stone-200 dark:border-stone-800 flex justify-between items-center">
          <h2
            id="bulk-upload-title"
            className="text-2xl font-semibold text-stone-900 dark:text-stone-100"
          >
            Carga Masiva de Videos
          </h2>
          <button
            onClick={onClose}
            className="text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 transition-colors"
            aria-label="Cerrar"
          >
            <CloseIcon className="w-6 h-6" />
          </button>
        </header>

        <main className="flex-grow p-6 overflow-y-auto space-y-6">
          {files.length === 0 ? (
            <div
              className="border-2 border-dashed border-stone-300 dark:border-stone-700 rounded-lg h-full flex flex-col items-center justify-center text-center text-stone-500 dark:text-stone-400"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const simulatedEvent = {
                  target: { files: e.dataTransfer.files }
                } as unknown as React.ChangeEvent<HTMLInputElement>;
                handleFileSelect(simulatedEvent);
              }}
            >
              <UploadIcon className="w-12 h-12 mb-4 opacity-50" />
              <p className="font-semibold text-stone-700 dark:text-stone-300">Arrastra y suelta tus videos aquí</p>
              <p className="text-sm">o</p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="mt-2 text-sky-600 dark:text-sky-400 font-semibold hover:underline"
              >
                Selecciona tus archivos
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {files.map((file) => (
                <div
                  key={file.id}
                  className="bg-white dark:bg-stone-800 p-4 rounded-lg shadow-sm border border-stone-200 dark:border-stone-700 grid grid-cols-1 md:grid-cols-3 gap-4"
                >
                  <div className="w-full aspect-[9/16] bg-black rounded-md overflow-hidden relative shadow-inner">
                    <video
                      ref={file.videoRef}
                      src={file.previewUrl}
                      muted
                      playsInline
                      className={`w-full h-full object-cover transition-all duration-500 ${file.status === "completed" ? "opacity-60 grayscale-[0.3]" : ""}`}
                      crossOrigin="anonymous"
                    />

                    {/* overlays premium */}
                    <ScanningOverlay status={file.status} />

                    {file.status === "completed" && (
                      <div className="absolute inset-0 bg-black/20 flex items-center justify-center animate-fade-in-down pointer-events-none">
                        <div className="bg-emerald-500/10 backdrop-blur-[2px] w-full h-full flex items-center justify-center">
                          <div className="bg-white/10 backdrop-blur-md p-2 rounded-full border border-white/20 shadow-xl">
                            <CheckCircleIcon className="w-6 h-6 text-emerald-400" />
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="absolute top-2 right-2 z-20">
                      <StatusIndicator status={file.status} />
                    </div>
                  </div>
                  <div className="md:col-span-2 space-y-3">
                    <div className="space-y-1">
                      <input
                        type="text"
                        placeholder="Título"
                        value={file.garmentData.title}
                        onChange={(e) =>
                          handleInputChange(file.id, "title", e.target.value)
                        }
                        className={`w-full p-2 border rounded-md text-sm bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 transition-colors ${file.validationErrors?.title ? 'border-red-500 focus:ring-1 focus:ring-red-500' : 'border-stone-300 dark:border-stone-700 focus:ring-1 focus:ring-stone-500 dark:focus:ring-stone-400'}`}
                      />
                      {file.validationErrors?.title && (
                        <span className="text-[10px] text-red-500 dark:text-red-400 font-medium block px-1">
                          {file.validationErrors.title}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <input
                          type="text"
                          placeholder="Marca"
                          value={file.garmentData.brand}
                          onChange={(e) =>
                            handleInputChange(file.id, "brand", e.target.value)
                          }
                          className={`w-full p-2 border rounded-md text-sm bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 transition-colors ${file.validationErrors?.brand ? 'border-red-500 focus:ring-1 focus:ring-red-500' : 'border-stone-300 dark:border-stone-700 focus:ring-1 focus:ring-stone-500 dark:focus:ring-stone-400'}`}
                        />
                        {file.validationErrors?.brand && (
                          <span className="text-[10px] text-red-500 dark:text-red-400 font-medium block px-1">
                            {file.validationErrors.brand}
                          </span>
                        )}
                      </div>
                      <div className="space-y-1">
                        <input
                          type="text"
                          placeholder="Talla"
                          value={file.garmentData.size}
                          onChange={(e) =>
                            handleInputChange(file.id, "size", e.target.value)
                          }
                          className={`w-full p-2 border rounded-md text-sm bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 transition-colors ${file.validationErrors?.size ? 'border-red-500 focus:ring-1 focus:ring-red-500' : 'border-stone-300 dark:border-stone-700 focus:ring-1 focus:ring-stone-500 dark:focus:ring-stone-400'}`}
                        />
                        {file.validationErrors?.size && (
                          <span className="text-[10px] text-red-500 dark:text-red-400 font-medium block px-1">
                            {file.validationErrors.size}
                          </span>
                        )}
                      </div>
                      <div className="space-y-1">
                        <input
                          type="text"
                          placeholder="Color"
                          value={file.garmentData.color}
                          onChange={(e) =>
                            handleInputChange(file.id, "color", e.target.value)
                          }
                          className={`w-full p-2 border rounded-md text-sm bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 transition-colors ${file.validationErrors?.color ? 'border-red-500 focus:ring-1 focus:ring-red-500' : 'border-stone-300 dark:border-stone-700 focus:ring-1 focus:ring-stone-500 dark:focus:ring-stone-400'}`}
                        />
                        {file.validationErrors?.color && (
                          <span className="text-[10px] text-red-500 dark:text-red-400 font-medium block px-1">
                            {file.validationErrors.color}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="relative">
                        <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-stone-500 dark:text-stone-400 text-sm">
                          S/
                        </span>
                        <input
                          type="number"
                          placeholder="Precio"
                          value={file.garmentData.price}
                          onChange={(e) =>
                            handleInputChange(file.id, "price", e.target.value)
                          }
                          className={`w-full p-2 pl-8 border rounded-md text-sm bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 transition-colors ${file.validationErrors?.price ? 'border-red-500 focus:ring-1 focus:ring-red-500' : 'border-stone-300 dark:border-stone-700 focus:ring-1 focus:ring-stone-500 dark:focus:ring-stone-400'}`}
                        />
                      </div>
                      {file.validationErrors?.price && (
                        <span className="text-[10px] text-red-500 dark:text-red-400 font-medium block px-1">
                          {file.validationErrors.price}
                        </span>
                      )}
                    </div>
                    <div className="space-y-1">
                      <input
                        type="number"
                        placeholder="Stock / Cantidad"
                        value={file.garmentData.cantidad}
                        min="0"
                        step="1"
                        onChange={(e) =>
                          handleInputChange(file.id, "cantidad", e.target.value)
                        }
                        className={`w-full p-2 border rounded-md text-sm bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 transition-colors ${file.validationErrors?.cantidad ? 'border-red-500 focus:ring-1 focus:ring-red-500' : 'border-stone-300 dark:border-stone-700 focus:ring-1 focus:ring-stone-500 dark:focus:ring-stone-400'}`}
                      />
                      {file.validationErrors?.cantidad && (
                        <span className="text-[10px] text-red-500 dark:text-red-400 font-medium block px-1">
                          {file.validationErrors.cantidad}
                        </span>
                      )}
                    </div>
                    <div className="space-y-1">
                      <textarea
                        placeholder="Descripción"
                        value={file.garmentData.description}
                        onChange={(e) =>
                          handleInputChange(
                            file.id,
                            "description",
                            e.target.value,
                          )
                        }
                        rows={3}
                        className={`w-full p-2 border rounded-md text-sm bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 transition-colors ${file.validationErrors?.description ? 'border-red-500 focus:ring-1 focus:ring-red-500' : 'border-stone-300 dark:border-stone-700 focus:ring-1 focus:ring-stone-500 dark:focus:ring-stone-400'}`}
                      />
                      {file.validationErrors?.description && (
                        <span className="text-[10px] text-red-500 dark:text-red-400 font-medium block px-1">
                          {file.validationErrors.description}
                        </span>
                      )}
                    </div>

                    <input
                      type="text"
                      placeholder="Materiales (ej: Seda, Lino)"
                      value={file.garmentData.material}
                      onChange={(e) =>
                        handleInputChange(file.id, "material", e.target.value)
                      }
                      className="w-full p-2 border border-stone-300 dark:border-stone-700 rounded-md text-sm bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 transition-colors"
                    />
                    <input
                      type="text"
                      placeholder="Ocasión (ej: Boda, Gala)"
                      value={file.garmentData.occasion}
                      onChange={(e) =>
                        handleInputChange(file.id, "occasion", e.target.value)
                      }
                      className="w-full p-2 border border-stone-300 dark:border-stone-700 rounded-md text-sm bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 transition-colors"
                    />
                    <input
                      type="text"
                      placeholder="Notas de Estilo (ej: Corte sirena)"
                      value={file.garmentData.style_notes}
                      onChange={(e) =>
                        handleInputChange(
                          file.id,
                          "style_notes",
                          e.target.value,
                        )
                      }
                      className="w-full p-2 border border-stone-300 dark:border-stone-700 rounded-md text-sm bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 transition-colors"
                    />

                    {file.status === "uploading" && (
                      <ProgressBar progress={file.progress} />
                    )}
                    {file.errorMessage && (
                      <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                        <p className="text-xs text-red-600 dark:text-red-400 font-medium flex items-center gap-2">
                          <ExclamationTriangleIcon className="w-4 h-4" />
                          {file.errorMessage}
                        </p>
                      </div>
                    )}
                    <div className="text-right">
                      <button
                        onClick={() => handleRemoveFile(file.id)}
                        className="text-xs text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 transition-colors font-medium"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="video/*"
            onChange={(e) => handleFileSelect(e)}
            className="hidden"
          />
        </main>

        <footer className="p-4 border-t border-stone-200 dark:border-stone-800 bg-white/50 dark:bg-stone-900/50 backdrop-blur-sm flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 sm:gap-0">
          <div className="w-full sm:w-auto">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full sm:w-auto bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-200 font-medium py-2 px-4 rounded-lg border border-stone-300 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors text-sm"
            >
              + Añadir más
            </button>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
            <button
              onClick={processQueue}
              disabled={isProcessing || pendingCount === 0}
              className="w-full sm:w-auto bg-stone-800 dark:bg-stone-100 text-white dark:text-stone-900 font-medium py-2 px-4 rounded-lg hover:bg-stone-700 dark:hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm inline-flex items-center justify-center gap-2 shadow-sm"
            >
              {isProcessing ? (
                <SpinnerIcon className="w-4 h-4 animate-spin" />
              ) : (
                <SparklesIcon className="w-4 h-4" />
              )}
              {isProcessing
                ? "Autocompletando..."
                : `Autocompletar (${pendingCount}) con IA`}
            </button>
            <button
              onClick={handleSaveAll}
              disabled={isSaving || readyToSaveCount === 0}
              className="w-full sm:w-auto bg-sky-600 dark:bg-sky-500 text-white font-medium py-2 px-4 rounded-lg hover:bg-sky-700 dark:hover:bg-sky-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm shadow-sm"
            >
              {isSaving
                ? "Guardando..."
                : `Guardar Listos (${readyToSaveCount})`}
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
};

const StatusIndicator: React.FC<{ status: UploadStatus }> = ({ status }) => {
  const statusMap = {
    pending: { icon: null, color: "" },
    uploading: {
      icon: <SpinnerIcon className="w-4 h-4 animate-spin" />,
      color: "bg-blue-500/80",
    },
    processing: {
      icon: <SparklesIcon className="w-4 h-4 animate-pulse" />,
      color: "bg-sky-500/80 shadow-[0_0_10px_rgba(56,189,248,0.5)]",
    },
    completed: {
      icon: <CheckCircleIcon className="w-4 h-4" />,
      color: "bg-emerald-500/80",
    },
    error: {
      icon: <ExclamationTriangleIcon className="w-4 h-4" />,
      color: "bg-red-500/80",
    },
  };

  const current = statusMap[status];
  if (!current.icon) return null;

  return (
    <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-white text-[10px] font-bold backdrop-blur-md ${current.color} border border-white/20 transition-all duration-300 animate-fade-in-down`}>
      {current.icon}
      <span className="uppercase tracking-tight">
        {status === "processing" ? "Análisis IA" : status === "completed" ? "Listo" : status === "uploading" ? "Subiendo" : status === "error" ? "Error" : ""}
      </span>
    </div>
  );
};

const ScanningOverlay: React.FC<{ status: UploadStatus }> = ({ status }) => {
  if (status !== "processing") return null;
  return (
    <div className="absolute inset-0 pointer-events-none z-10">
      {/* Glass overlay */}
      <div className="absolute inset-0 bg-sky-500/5 backdrop-blur-[1px]" />

      {/* Scanning bar */}
      <div className="absolute left-0 right-0 h-0.5 bg-sky-400 shadow-[0_0_15px_rgba(56,189,248,0.8)] animate-scan" />

      {/* Radial gradient glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)]" />
    </div>
  );
};

const ProgressBar: React.FC<{ progress: number }> = ({ progress }) => (
  <div className="w-full bg-stone-200 dark:bg-stone-700 rounded-full h-1.5 overflow-hidden">
    <div
      className="bg-sky-500 dark:bg-sky-400 h-1.5 rounded-full transition-all duration-300 ease-out"
      style={{ width: `${progress}%` }}
    ></div>
  </div>
);

export default BulkUploadModal;
