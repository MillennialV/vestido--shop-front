"use client";

import React, { useState, useEffect, useRef } from "react";
import type { Garment } from "@/types/Garment";
// import { iaService } from "../services/iaService";
import { useProducts } from "../hooks/useProducts";
import { CloseIcon, SparklesIcon, SpinnerIcon } from "./Icons";

const isExternalVideo = (url: string) => {
  if (!url) return false;
  return (
    url.includes("youtube.com") ||
    url.includes("youtu.be") ||
    url.includes("vimeo.com")
  );
};

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

interface AdminFormModalProps {
  isOpen: boolean;
  garment: Garment | null;
  onClose: () => void;
  onSave?: (product: Garment) => void;
}

const AdminFormModal: React.FC<AdminFormModalProps> = ({
  isOpen,
  garment,
  onClose,
  onSave,
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

  const [formData, setFormData] = useState({
    title: "",
    brand: "",
    size: "",
    color: "",
    description: "",
    price: "",
    material: "",
    occasion: "",
    style_notes: "",
    videoUrl: "", // URL manual de video como alternativa
    imagen_principal: "", // URL manual de imagen principal
    cantidad: "",
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [imagePrincipalFile, setImagePrincipalFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const {
    createProduct,
    updateProduct,
    isLoading: isProductLoading,
  } = useProducts();

  const firstInputRef = useRef<HTMLInputElement>(null);
  const videoPreviewRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && garment) {
      setFormData({
        title: garment.title,
        brand: garment.brand,
        size: garment.size,
        color: garment.color,
        description: garment.description,
        price: garment.price ? String(garment.price) : "",
        material: garment.material || "",
        occasion: garment.occasion || "",
        style_notes: garment.style_notes || "",
        videoUrl: garment.videoUrl || "",
        imagen_principal: garment.imagen_principal || "",
        cantidad: garment.cantidad !== undefined && garment.cantidad !== null ? String(garment.cantidad) : "0",
      });
      setPreviewUrl(garment.videoUrl || garment.imagen_principal || null);

      // Delay focus to allow entry animation
      const timer = setTimeout(() => firstInputRef.current?.focus(), 100);
      return () => clearTimeout(timer);
    } else if (isOpen && !garment) {
      // Reset form for "Add New" mode
      setFormData({
        title: "",
        brand: "",
        size: "M",
        color: "",
        description: "",
        price: "",
        material: "",
        occasion: "",
        style_notes: "",
        videoUrl: "",
        imagen_principal: "",
        cantidad: "1",
      });
      setPreviewUrl(null);
      setVideoFile(null);
      setImagePrincipalFile(null);
      setFormErrors({});
    }
  }, [isOpen, garment]);

  useEffect(() => {
    const currentPreviewUrl = previewUrl;
    return () => {
      if (currentPreviewUrl && currentPreviewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(currentPreviewUrl);
      }
    };
  }, [previewUrl]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setVideoFile(file);
      const newPreviewUrl = URL.createObjectURL(file);
      setPreviewUrl(newPreviewUrl);
      // Limpiar URL manual cuando se sube un archivo
      setFormData((prev) => ({ ...prev, videoUrl: "" }));
    }
  };

  const handleVideoUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setFormData((prev) => ({ ...prev, videoUrl: url }));
    if (url) {
      setPreviewUrl(url);
      setVideoFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } else if (!videoFile && !imagePrincipalFile && !formData.imagen_principal) {
      setPreviewUrl(null);
    }
  };

  const handleImagePrincipalUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setFormData((prev) => ({ ...prev, imagen_principal: url }));
    if (url) {
      // Solo mostrar preview de imagen si no hay video activo
      if (!videoFile && !formData.videoUrl) {
        setPreviewUrl(url);
      }
      setImagePrincipalFile(null);
    } else if (!videoFile && !formData.videoUrl && !imagePrincipalFile) {
      setPreviewUrl(null);
    }
  };

  const handleImagePrincipalFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImagePrincipalFile(file);
      const newPreviewUrl = URL.createObjectURL(file);
      // Si no hay video, usar la imagen como preview
      if (!videoFile && !formData.videoUrl) {
        setPreviewUrl(newPreviewUrl);
      }
      setFormData((prev) => ({ ...prev, imagen_principal: "" }));
    }
  };

  const handleRemoveVideo = () => {
    setVideoFile(null);
    if (!imagePrincipalFile && !formData.imagen_principal) {
      setPreviewUrl(null);
    } else {
      setPreviewUrl(formData.imagen_principal || (imagePrincipalFile ? URL.createObjectURL(imagePrincipalFile) : null));
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemoveImagePrincipal = () => {
    setImagePrincipalFile(null);
    setFormData(prev => ({ ...prev, imagen_principal: "" }));
    if (!videoFile && !formData.videoUrl) {
      setPreviewUrl(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const errors: Record<string, string> = {};
    if (!formData.title) errors.title = "El título es requerido";
    if (!formData.brand) errors.brand = "La marca es requerida";
    if (!formData.size) errors.size = "La talla es requerida";
    if (!formData.color) errors.color = "El color es requerido";
    if (!formData.description) errors.description = "La descripción es requerida";

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    const priceAsNumber = formData.price
      ? parseFloat(formData.price)
      : undefined;
    if (formData.price && isNaN(priceAsNumber!)) {
      setFormErrors(prev => ({ ...prev, price: "Precio inválido" }));
      return;
    }

    const cantidadAsNumber = formData.cantidad
      ? parseInt(formData.cantidad, 10)
      : 0;

    if (isNaN(cantidadAsNumber) || cantidadAsNumber < 0) {
      setFormErrors(prev => ({ ...prev, cantidad: "El stock no puede ser negativo" }));
      return;
    }

    const dataToSave = {
      title: formData.title,
      brand: formData.brand,
      size: formData.size,
      color: formData.color,
      description: formData.description,
      price: priceAsNumber,
      cantidad: cantidadAsNumber,
      material: formData.material,
      occasion: formData.occasion,
      style_notes: formData.style_notes,
      ...(formData.videoUrl && !videoFile
        ? { videoUrl: formData.videoUrl }
        : {}),
    };

    // Determinar si es crear o actualizar
    const savePromise =
      garment && garment.id
        ? updateProduct(garment.id, dataToSave, videoFile, imagePrincipalFile)
        : createProduct(dataToSave, videoFile, imagePrincipalFile);

    savePromise
      .then((product) => {
        setFormErrors({});
        if (onSave) {
          try {
            onSave(product);
          } catch (callbackError) {
            console.error("Error en callback onSave:", callbackError);
          }
        }
        // Asegurar que el modal se cierre
        setTimeout(() => onClose(), 100);
      })
      .catch((error) => {
        // Manejar errores de validación del backend
        if (error.errors && Array.isArray(error.errors)) {
          const errorsObj: Record<string, string> = {};
          error.errors.forEach((err: any) => {
            if (err.field) {
              errorsObj[err.field] = err.message;
            }
          });
          setFormErrors(errorsObj);
        } else if (error.message || error.error) {
          // Error general
          setFormErrors({ general: error.message || error.error });
        } else {
          setFormErrors({ general: "Error desconocido al guardar el producto" });
        }
      });
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

  const handleAiAutocomplete = async () => {
    if (!previewUrl && !videoFile && !imagePrincipalFile && !formData.videoUrl && !formData.imagen_principal) {
      return;
    }

    setIsAiLoading(true);

    try {
      let base64Image = "";
      let imageUrlToSend = "";

      // 1. Imagen Local
      if (imagePrincipalFile) {
        base64Image = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve((reader.result as string).split(",")[1]);
          reader.onerror = reject;
          reader.readAsDataURL(imagePrincipalFile);
        });
      }
      // 2. Video Local
      else if (videoFile && videoPreviewRef.current) {
        if (videoPreviewRef.current.readyState < 2) {
          await new Promise((resolve, reject) => {
            videoPreviewRef.current!.addEventListener("loadeddata", resolve, { once: true });
            videoPreviewRef.current!.addEventListener("error", () => reject(new Error("Error al cargar video")), { once: true });
          });
        }
        base64Image = await captureFrame(videoPreviewRef.current);
      }
      // 3. YouTube (Automático por Thumbnail)
      else if (formData.videoUrl && (formData.videoUrl.includes("youtube.com") || formData.videoUrl.includes("youtu.be"))) {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|shorts\/)([^#\&\?]*).*/;
        const match = formData.videoUrl.match(regExp);
        const videoId = match && match[2] && match[2].length === 11 ? match[2] : null;

        if (videoId) {
          imageUrlToSend = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
        } else {
          throw new Error("No se pudo identificar el video de YouTube.");
        }
      }
      // 4. URL de Imagen
      else if (formData.imagen_principal) {
        imageUrlToSend = formData.imagen_principal;
      }
      // 5. Video Externo Genérico
      else if (formData.videoUrl) {
        if (isExternalVideo(formData.videoUrl)) {
          throw new Error("La IA no puede analizar este tipo de video directamente. Por favor sube una imagen de portada.");
        }
        if (videoPreviewRef.current) {
          base64Image = await captureFrame(videoPreviewRef.current);
        }
      }

      if (!base64Image && !imageUrlToSend) {
        throw new Error("No hay una fuente visual válida para que la IA analice la prenda.");
      }

      // Llamar al API route de Next.js para análisis de prenda
      const response = await fetch("/api/ia/analyze-garment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(base64Image ? { imageBase64: base64Image } : { imageUrl: imageUrlToSend })
        }),
      });

      if (!response.ok) {
        throw new Error("Error al analizar la prenda con IA");
      }
      const result = await response.json();

      // Autocompletar los campos con la información del análisis
      setFormData((prev) => {
        const newPrice = result.price;
        let priceString = prev.price; // Mantener el valor actual por defecto

        if (typeof newPrice === "number" && !isNaN(newPrice) && newPrice > 0) {
          priceString = String(newPrice);
        }

        return {
          ...prev,
          title: result.title || prev.title,
          brand: result.brand || prev.brand,
          color: result.color || prev.color,
          description: result.description || prev.description,
          price: priceString,
          material: result.material || prev.material,
          occasion: result.occasion || prev.occasion,
          style_notes: result.style_notes || prev.style_notes,
        };
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      // Mensajes más específicos según el tipo de error
      if (errorMessage.includes("conexión") || errorMessage.includes("fetch")) {
        console.log(
          "Error de conexión: Verifica que el servicio de IA esté disponible y que VITE_IA_URL esté configurado correctamente.",
        );
      } else if (
        errorMessage.includes("cargando") ||
        errorMessage.includes("503")
      ) {
        console.log(
          "El modelo de IA está iniciando. Por favor, espera unos segundos e intenta de nuevo.",
        );
      } else if (errorMessage.includes("YouTube") || errorMessage.includes("Vimeo") || errorMessage.includes("portada")) {
        console.log(`Aviso: ${errorMessage}`);
      } else if (errorMessage.includes("video")) {
        console.log(
          `Error al procesar video: ${errorMessage}. Asegúrate de que el video esté cargado correctamente.`,
        );
      } else {
        console.log(
          `Error al analizar con IA: ${errorMessage}. Por favor, revisa la consola para más detalles.`,
        );
      }
    } finally {
      setIsAiLoading(false);
    }
  };

  const isAiDisabled = !previewUrl || isAiLoading;

  if (!isRendered) return null;

  return (
    <div
      className={`fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 transition-opacity duration-300 ease-in-out ${isVisible ? 'opacity-100' : 'opacity-0'}`}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="form-modal-title"
    >
      <div
        className={`relative bg-stone-50 dark:bg-stone-800 rounded-lg shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto transition-all duration-300 ease-in-out ${isVisible ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-4'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-8">
          <h2
            id="form-modal-title"
            className="text-3xl font-semibold text-stone-900 dark:text-stone-100 mb-6"
          >
            {garment ? "Editar Prenda" : "Añadir Nueva Prenda"}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="bg-stone-100 dark:bg-stone-700/30 p-4 rounded-lg border border-stone-200 dark:border-stone-700 space-y-4">
              <label className="block text-sm font-semibold text-stone-700 dark:text-stone-200 mb-2">
                Medios y Contenido Visual
              </label>

              <div className="space-y-4">
                {(!formData.videoUrl && !imagePrincipalFile && !formData.imagen_principal) && (
                  <div className="space-y-2">
                    <span className="text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wider">Video local</span>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="video/*"
                      onChange={handleFileChange}
                      className="block w-full text-sm text-stone-600 dark:text-stone-300
                                    file:mr-4 file:py-1.5 file:px-3
                                    file:rounded-md file:border-0
                                    file:text-xs file:font-semibold
                                    file:bg-stone-200 dark:file:bg-stone-700 file:text-stone-700 dark:file:text-stone-200
                                    hover:file:bg-stone-300 dark:hover:file:bg-stone-600 transition-colors cursor-pointer"
                    />
                    {videoFile && (
                      <div className="flex items-center justify-between p-2 bg-white dark:bg-stone-800 rounded border border-stone-200 dark:border-stone-700">
                        <p className="text-xs text-stone-600 dark:text-stone-400 truncate pr-4">Video: {videoFile.name}</p>
                        <button type="button" onClick={handleRemoveVideo} className="text-red-500 hover:text-red-700"><CloseIcon className="w-4 h-4" /></button>
                      </div>
                    )}
                  </div>
                )}
                {(!videoFile && !imagePrincipalFile && !formData.imagen_principal) && (
                  <div className="space-y-2">
                    <span className="text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wider">Enlace de Video (YouTube/Vimeo)</span>
                    <input
                      type="url"
                      name="videoUrl"
                      value={formData.videoUrl}
                      onChange={handleVideoUrlChange}
                      placeholder="https://..."
                      className="w-full p-2 text-sm border border-stone-300 dark:border-stone-600 rounded-md bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100"
                    />
                  </div>
                )}
                {(!videoFile && !formData.videoUrl) && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wider">Imagen de Portada</span>
                      {(imagePrincipalFile || formData.imagen_principal) && (
                        <button type="button" onClick={handleRemoveImagePrincipal} className="text-xs text-red-500 hover:underline">Quitar Imagen</button>
                      )}
                    </div>
                    {!formData.imagen_principal && (
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImagePrincipalFileChange}
                        className="block w-full text-sm text-stone-600 dark:text-stone-300
                                    file:mr-4 file:py-1.5 file:px-3
                                    file:rounded-md file:border-0
                                    file:text-xs file:font-semibold
                                    file:bg-stone-200 dark:file:bg-stone-700 file:text-stone-700 dark:file:text-stone-200
                                    hover:file:bg-stone-300 dark:hover:file:bg-stone-600 transition-colors cursor-pointer"
                      />
                    )}
                    {imagePrincipalFile && (
                      <div className="flex items-center justify-between p-2 bg-white dark:bg-stone-800 rounded border border-stone-200 dark:border-stone-700">
                        <p className="text-xs text-stone-600 dark:text-stone-400 truncate pr-4">Imagen: {imagePrincipalFile.name}</p>
                      </div>
                    )}
                    {!imagePrincipalFile && (
                      <div className="items-center ">
                        <span className="w-full text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wider">Enlace de imagen</span>
                        <input
                          type="url"
                          name="imagen_principal"
                          value={formData.imagen_principal}
                          onChange={handleImagePrincipalUrlChange}
                          placeholder="https://..."
                          className="w-full p-2 text-sm border border-stone-300 dark:border-stone-600 rounded-md bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {previewUrl && (
                <div className="mt-4 pt-4 border-t border-stone-200 dark:border-stone-700">
                  <span className="text-xs font-medium text-stone-500 dark:text-stone-400 block mb-2 uppercase">Vista Previa Actual</span>
                  <div className="relative rounded-lg overflow-hidden bg-black aspect-video max-h-[200px] flex items-center justify-center">
                    {(videoFile || formData.videoUrl) ? (
                      getEmbedUrl(formData.videoUrl) ? (
                        <iframe
                          src={getEmbedUrl(formData.videoUrl)!}
                          className="w-full h-full border-0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      ) : (
                        <video
                          ref={videoPreviewRef}
                          src={previewUrl}
                          controls
                          crossOrigin="anonymous"
                          className="w-full h-full object-contain"
                        />
                      )
                    ) : (
                      <img
                        src={previewUrl}
                        crossOrigin="anonymous"
                        className="w-full h-full object-contain"
                        alt="Preview"
                      />
                    )}
                  </div>
                </div>
              )}
            </div>
            <div>
              <button
                type="button"
                onClick={handleAiAutocomplete}
                disabled={isAiDisabled}
                title={
                  isAiDisabled && !isAiLoading
                    ? "Sube un video para activar la IA."
                    : "Autocompletar datos con IA"
                }
                className="w-full flex items-center justify-center gap-2 text-sm font-medium py-2 px-4 rounded-lg border border-stone-500 dark:border-stone-400 text-stone-700 dark:text-stone-200 hover:bg-stone-200 dark:hover:bg-stone-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isAiLoading ? (
                  <>
                    <SpinnerIcon className="w-4 h-4 animate-spin" />
                    Analizando...
                  </>
                ) : (
                  <>
                    <SparklesIcon className="w-4 h-4" />
                    Autocompletar con IA
                  </>
                )}
              </button>
            </div>
            <div>
              <label
                htmlFor="title"
                className="block text-sm font-medium text-stone-600 dark:text-stone-300 mb-1"
              >
                Título
              </label>
              <input
                ref={firstInputRef}
                type="text"
                name="title"
                id="title"
                value={formData.title}
                onChange={handleChange}
                className="w-full p-2 border border-stone-300 dark:border-stone-600 rounded-md focus:ring-stone-500 dark:focus:ring-stone-400 focus:border-stone-500 dark:focus:border-stone-500 bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100"
              />
              {formErrors.title && <p className="text-red-500 text-xs mt-1">{formErrors.title}</p>}
            </div>
            <div>
              <label
                htmlFor="brand"
                className="block text-sm font-medium text-stone-600 dark:text-stone-300 mb-1"
              >
                Marca
              </label>
              <input
                type="text"
                name="brand"
                id="brand"
                value={formData.brand}
                onChange={handleChange}
                className="w-full p-2 border border-stone-300 dark:border-stone-600 rounded-md focus:ring-stone-500 dark:focus:ring-stone-400 focus:border-stone-500 dark:focus:border-stone-500 bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100"
              />
              {formErrors.brand && <p className="text-red-500 text-xs mt-1">{formErrors.brand}</p>}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="size"
                  className="block text-sm font-medium text-stone-600 dark:text-stone-300 mb-1"
                >
                  Talla
                </label>
                <input
                  type="text"
                  name="size"
                  id="size"
                  value={formData.size}
                  onChange={handleChange}
                  className="w-full p-2 border border-stone-300 dark:border-stone-600 rounded-md focus:ring-stone-500 dark:focus:ring-stone-400 focus:border-stone-500 dark:focus:border-stone-500 bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100"
                />
                {formErrors.size && <p className="text-red-500 text-xs mt-1">{formErrors.size}</p>}
              </div>
              <div>
                <label
                  htmlFor="color"
                  className="block text-sm font-medium text-stone-600 dark:text-stone-300 mb-1"
                >
                  Color
                </label>
                <input
                  type="text"
                  name="color"
                  id="color"
                  value={formData.color}
                  onChange={handleChange}
                  className="w-full p-2 border border-stone-300 dark:border-stone-600 rounded-md focus:ring-stone-500 dark:focus:ring-stone-400 focus:border-stone-500 dark:focus:border-stone-500 bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100"
                />
                {formErrors.color && <p className="text-red-500 text-xs mt-1">{formErrors.color}</p>}
              </div>
            </div>
            <div>
              <label
                htmlFor="price"
                className="block text-sm font-medium text-stone-600 dark:text-stone-300 mb-1"
              >
                Precio (Opcional)
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <span className="text-stone-500 dark:text-stone-400 sm:text-sm">
                    S/
                  </span>
                </div>
                <input
                  type="number"
                  name="price"
                  id="price"
                  value={formData.price}
                  onChange={handleChange}
                  placeholder="99.99"
                  min="0"
                  step="0.01"
                  className="w-full p-2 pl-8 border border-stone-300 dark:border-stone-600 rounded-md focus:ring-stone-500 dark:focus:ring-stone-400 focus:border-stone-500 dark:focus:border-stone-500 bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100"
                />
              </div>
              {formErrors.price && <p className="text-red-500 text-xs mt-1">{formErrors.price}</p>}
            </div>
            <div>
              <label
                htmlFor="cantidad"
                className="block text-sm font-medium text-stone-600 dark:text-stone-300 mb-1"
              >
                Stock (Cantidad)
              </label>
              <input
                type="number"
                name="cantidad"
                id="cantidad"
                value={formData.cantidad}
                onChange={handleChange}
                placeholder="10"
                className="w-full p-2 border border-stone-300 dark:border-stone-600 rounded-md focus:ring-stone-500 dark:focus:ring-stone-400 focus:border-stone-500 dark:focus:border-stone-500 bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100"
              />
              {formErrors.cantidad && <p className="text-red-500 text-xs mt-1">{formErrors.cantidad}</p>}
            </div>

            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-stone-600 dark:text-stone-300 mb-1"
              >
                Descripción
              </label>
              <textarea
                name="description"
                id="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className="w-full p-2 border border-stone-300 dark:border-stone-600 rounded-md focus:ring-stone-500 dark:focus:ring-stone-400 focus:border-stone-500 dark:focus:border-stone-500 bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100"
              />
              {formErrors.description && <p className="text-red-500 text-xs mt-1">{formErrors.description}</p>}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="material"
                  className="block text-sm font-medium text-stone-600 dark:text-stone-300 mb-1"
                >
                  Materiales
                </label>
                <input
                  type="text"
                  name="material"
                  id="material"
                  value={formData.material}
                  onChange={handleChange}
                  placeholder="Ej: Seda, Lino"
                  className="w-full p-2 border border-stone-300 dark:border-stone-600 rounded-md focus:ring-stone-500 dark:focus:ring-stone-400 focus:border-stone-500 dark:focus:border-stone-500 bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100"
                />
              </div>
              <div>
                <label
                  htmlFor="occasion"
                  className="block text-sm font-medium text-stone-600 dark:text-stone-300 mb-1"
                >
                  Ocasión Ideal
                </label>
                <input
                  type="text"
                  name="occasion"
                  id="occasion"
                  value={formData.occasion}
                  onChange={handleChange}
                  placeholder="Ej: Boda de día, Gala"
                  className="w-full p-2 border border-stone-300 dark:border-stone-600 rounded-md focus:ring-stone-500 dark:focus:ring-stone-400 focus:border-stone-500 dark:focus:border-stone-500 bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100"
                />
              </div>
            </div>
            <div>
              <label
                htmlFor="style_notes"
                className="block text-sm font-medium text-stone-600 dark:text-stone-300 mb-1"
              >
                Notas de Estilo
              </label>
              <input
                type="text"
                name="style_notes"
                id="style_notes"
                value={formData.style_notes}
                onChange={handleChange}
                placeholder="Ej: Corte sirena, Espalda descubierta"
                className="w-full p-2 border border-stone-300 dark:border-stone-600 rounded-md focus:ring-stone-500 dark:focus:ring-stone-400 focus:border-stone-500 dark:focus:border-stone-500 bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100"
              />
              {formErrors.style_notes && <p className="text-red-500 text-xs mt-1">{formErrors.style_notes}</p>}
            </div>
            {formErrors.general && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 rounded-lg">
                <p className="text-red-600 dark:text-red-400 text-sm">{formErrors.general}</p>
              </div>
            )}
            <div className="flex justify-end gap-4 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="bg-white dark:bg-stone-700 text-stone-700 dark:text-stone-200 font-medium py-2 px-4 rounded-lg border border-stone-300 dark:border-stone-600 hover:bg-stone-100 dark:hover:bg-stone-600 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isProductLoading}
                className="bg-stone-800 dark:bg-stone-700 text-white font-medium py-2 px-6 rounded-lg hover:bg-stone-700 dark:hover:bg-stone-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isProductLoading ? (
                  <>
                    <SpinnerIcon className="w-4 h-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  "Guardar"
                )}
              </button>
            </div>
          </form>
        </div>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 z-10 transition-colors rounded-full focus:outline-none focus:ring-4 focus:ring-offset-2 focus:ring-stone-500 dark:focus:ring-stone-400"
          aria-label="Cerrar formulario"
        >
          <CloseIcon className="w-8 h-8" />
        </button>
      </div>

    </div>
  );
};

export default AdminFormModal;
