"use client";

import React, { useState, useEffect, useRef } from "react";
import type { Garment } from "@/types/Garment";
import { useProducts } from "@/hooks/useProducts";
import { CloseIcon, SparklesIcon, SpinnerIcon } from "@/components/ui/Icons";
import { convertToWebP } from "@/lib/imageUtils";

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
  onAuthError?: (message: string) => void;
}

const AdminFormModal: React.FC<AdminFormModalProps> = ({
  isOpen,
  garment,
  onClose,
  onSave,
  onAuthError,
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
    description: "",
    price: "",
    videoUrl: "", // URL manual de video como alternativa
    imagen_principal: "", // URL manual de imagen principal
    cantidad: "",
  });
  const [customFields, setCustomFields] = useState<{ id: string, key: string, value: string }[]>([]);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [imagePrincipalFile, setImagePrincipalFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [extraImages, setExtraImages] = useState<{ file?: File; preview: string; isNew: boolean }[]>([]);

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
        description: garment.description,
        price: garment.price ? String(garment.price) : "",
        videoUrl: garment.videoUrl || "",
        imagen_principal: garment.imagen_principal || "",
        cantidad: garment.cantidad !== undefined && garment.cantidad !== null ? String(garment.cantidad) : "0",
      });

      const initialCustom: { id: string, key: string, value: string }[] = [];
      if (garment.size) initialCustom.push({ id: `cf-size-${Date.now()}`, key: "size", value: String(garment.size) });
      if (garment.color) initialCustom.push({ id: `cf-color-${Date.now()}`, key: "color", value: String(garment.color) });

      if (garment.atributos_dinamicos) {
        Object.entries(garment.atributos_dinamicos).forEach(([k, v], i) => {
          if (k !== 'size' && k !== 'color') {
            initialCustom.push({ id: `cf-${i}-${Date.now()}`, key: k, value: String(v) });
          }
        });
      }
      setCustomFields(initialCustom);

      setPreviewUrl(garment.videoUrl || garment.imagen_principal || null);
      setExtraImages((garment.imagenes || []).slice(0, 3).map(url => ({ preview: url, isNew: false })));

      setVideoFile(null);
      setImagePrincipalFile(null);

      const timer = setTimeout(() => firstInputRef.current?.focus(), 100);
      return () => clearTimeout(timer);
    } else if (isOpen && !garment) {
      setFormData({
        title: "",
        brand: "",
        description: "",
        price: "",
        videoUrl: "",
        imagen_principal: "",
        cantidad: "1",
      });
      setCustomFields([]);
      setPreviewUrl(null);
      setVideoFile(null);
      setImagePrincipalFile(null);
      setExtraImages([]);
      setFormErrors({});
    }
  }, [isOpen, garment]);



  const handleExtraImagesChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newFiles = Array.from(files);
      const availableSlots = 3 - extraImages.length;
      const filesToAdd = newFiles.slice(0, availableSlots);

      const newImages = await Promise.all(filesToAdd.map(async file => {
        // Convertir cada imagen extra a WebP inmediatamente
        let fileToProcess = file;
        try {
          if (file.type.startsWith('image/')) {
            fileToProcess = await convertToWebP(file);
          }
        } catch (err) {
          console.error("Error al convertir imagen extra a WebP:", err);
        }

        return {
          file: fileToProcess,
          preview: URL.createObjectURL(fileToProcess),
          isNew: true
        };
      }));

      setExtraImages(prev => [...prev, ...newImages]);
    }
  };

  const handleRemoveExtraImage = (index: number) => {
    setExtraImages(prev => {
      const newImages = [...prev];
      const removed = newImages[index];
      if (removed.isNew) {
        URL.revokeObjectURL(removed.preview);
      }
      newImages.splice(index, 1);
      return newImages;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const errors: Record<string, string> = {};
    if (!formData.title) errors.title = "El título es requerido";
    if (!formData.brand) errors.brand = "La marca es requerida";
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

    try {
      // Separar imágenes nuevas (Archivos) de las existentes (URLs)
      const newImageFiles = extraImages
        .filter(img => img.isNew && img.file)
        .map(img => img.file!);

      const existingImageUrls = extraImages
        .filter(img => !img.isNew)
        .map(img => img.preview);

      const dataToSave: any = {
        title: formData.title,
        brand: formData.brand,
        description: formData.description,
        price: priceAsNumber,
        cantidad: cantidadAsNumber,
        imagenes: existingImageUrls,
        ...(formData.videoUrl && !videoFile
          ? { videoUrl: formData.videoUrl }
          : {}),
      };

      customFields.forEach(cf => {
        if (cf.key.trim() && cf.value.trim()) {
          dataToSave[cf.key.trim()] = cf.value.trim();
        }
      });

      // Determinar si es crear o actualizar
      // Nota: imagePrincipalFile y newImageFiles ya son WebP gracias a los handlers de selección
      const savePromise =
        garment && garment.id
          ? updateProduct(garment.id, dataToSave, videoFile, imagePrincipalFile, newImageFiles)
          : createProduct(dataToSave, videoFile, imagePrincipalFile, newImageFiles);

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
        .catch((error: any) => {
          // Manejar errores de sesión expirada
          if (error?.status === 401 || (error instanceof Error && error.message.includes('401'))) {
            if (onAuthError) {
              onAuthError("Tu sesión ha expirado. Por favor, inicia sesión de nuevo para continuar.");
            }
            onClose();
            return;
          }

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
    } catch (error: any) {
      console.error("Error preparing submission:", error);
      setFormErrors({ general: error.message || "Error al procesar imágenes" });
    }
  };


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

  const handleImagePrincipalFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Convertir a WebP inmediatamente para previsualización real
      let fileToProcess = file;
      try {
        fileToProcess = await convertToWebP(file);
      } catch (err) {
        console.error("Error al convertir imagen principal a WebP:", err);
      }

      setImagePrincipalFile(fileToProcess);
      const newPreviewUrl = URL.createObjectURL(fileToProcess);
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
        throw new Error("No hay una fuente visual válida para que la IA analice el producto.");
      }

      const baseSchema: Record<string, any> = {
        title: "nombre creativo del vestido",
        brand: "Identifica la marca",
        description: "breve descripción",
        price: 0,
      };

      // Agregar campos existentes al esquema para que la IA los llene
      customFields.forEach(cf => {
        if (cf.key.trim() && !baseSchema[cf.key.trim()]) {
          baseSchema[cf.key.trim()] = "valor detectado o null";
        }
      });
      const response = await fetch("/api/ia/analyze-garment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(base64Image ? { imageBase64: base64Image } : { imageUrl: imageUrlToSend }),
          dynamicSchema: baseSchema
        }),
      });

      if (!response.ok) {
        throw new Error("Error al analizar el producto con IA");
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
          description: result.description || prev.description,
          price: priceString,
        };
      });

      // Update customFields WITH case-insensitivity
      setCustomFields(prevKeys => {
        const newKeys = [...prevKeys];
        newKeys.forEach(cf => {
          if (cf.key) {
            // Buscar en result de forma insensible
            const resultKey = Object.keys(result).find(rk => rk.toLowerCase() === cf.key.toLowerCase());
            if (resultKey && result[resultKey] !== undefined && result[resultKey] !== null) {
              cf.value = String(result[resultKey]);
            }
          }
        });
        return newKeys;
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
        className={`relative bg-color-four dark:bg-[#1a1a1a] rounded-lg shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto transition-all duration-300 ease-in-out ${isVisible ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-4'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-8">
          <h2
            id="form-modal-title"
            className="text-3xl font-semibold text-color-three dark:text-white mb-6 font-serif"
          >
            {garment ? "Editar Producto" : "Añadir Nuevo Producto"}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="bg-color-three/5 dark:bg-[#0f0f0f]/30 p-4 rounded-lg border border-color-three/10 dark:border-[#2a2a2a] space-y-4">
              <label className="block text-sm font-semibold text-color-three dark:text-white mb-2">
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
                                    file:bg-color-three/10 dark:file:bg-[#0f0f0f] file:text-color-three dark:file:text-stone-200
                                    hover:file:bg-color-three/20 dark:hover:file:bg-[#2a2a2a] transition-colors cursor-pointer"
                    />
                    {videoFile && (
                      <div className="flex items-center justify-between p-2 bg-color-four dark:bg-[#1a1a1a] rounded border border-color-three/10 dark:border-[#2a2a2a]">
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
                      className="input-primary w-full p-2 border border-[#2a2a2a] rounded-md"
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
                                    file:bg-color-three/10 dark:file:bg-[#0f0f0f] file:text-color-three dark:file:text-stone-200
                                    hover:file:bg-color-three/20 dark:hover:file:bg-[#2a2a2a] transition-colors cursor-pointer"
                      />
                    )}
                    {imagePrincipalFile && (
                      <div className="flex items-center justify-between p-2 bg-color-four dark:bg-[#1a1a1a] rounded border border-color-three/10 dark:border-[#2a2a2a]">
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
                          className="input-primary w-full p-2 border border-color-three/20 dark:border-[#2a2a2a] rounded-md"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-color-three/10 dark:border-[#2a2a2a]">
                <label className="block text-sm font-semibold text-color-three dark:text-white mb-2">
                  Imágenes Adicionales (Opcional - Máx 3)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {extraImages.map((img, index) => (
                    <div key={index} className="relative aspect-square rounded-md overflow-hidden bg-color-three/10 dark:bg-[#0f0f0f]">
                      <img src={img.preview} alt={`Extra ${index}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => handleRemoveExtraImage(index)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <CloseIcon className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  {extraImages.length < 3 && (
                    <label className="flex items-center justify-center border-2 border-dashed border-color-three/20 dark:border-[#2a2a2a] rounded-md cursor-pointer hover:bg-color-four/80 dark:hover:bg-[#1a1a1a]/50 aspect-square">
                      <span className="text-xl text-stone-400">+</span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleExtraImagesChange}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>

              {previewUrl && (
                <div className="mt-4 pt-4 border-t border-color-three/10 dark:border-[#2a2a2a]">
                  <span className="text-xs font-medium text-stone-500 dark:text-[#a0a0a0] block mb-2 uppercase">Vista Previa</span>
                  <div className=" w-full relative rounded-lg overflow-hidden bg-black aspect-video max-h-[200px] flex items-center justify-center">
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
                          onError={(e) => {
                            // Si falla por CORS (crossOrigin), intentar cargar sin él
                            const video = e.currentTarget;
                            if (video.crossOrigin) {
                              video.removeAttribute('crossOrigin');
                              video.load();
                            }
                          }}
                        />
                      )
                    ) : (
                      <img
                        src={previewUrl}
                        className="w-full h-full object-contain"
                        alt="Preview"
                        onError={(e) => {
                          const img = e.currentTarget;
                          img.style.display = 'none';
                        }}
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
                className="w-full flex items-center justify-center gap-2 text-sm font-medium py-2 px-4 rounded-lg border border-color-three/20 dark:border-[#2a2a2a] text-color-three dark:text-white hover:bg-color-three/5 dark:hover:bg-[#2a2a2a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                className="block text-sm font-medium text-color-three dark:text-stone-300 mb-1"
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
                className="input-primary w-full p-2 border border-color-three/20 dark:border-[#2a2a2a] rounded-md"
              />
              {formErrors.title && <p className="text-red-500 text-xs mt-1">{formErrors.title}</p>}
            </div>
            <div>
              <label
                htmlFor="brand"
                className="block text-sm font-medium text-color-three dark:text-stone-300 mb-1"
              >
                Marca
              </label>
              <input
                type="text"
                name="brand"
                id="brand"
                value={formData.brand}
                onChange={handleChange}
                className="input-primary w-full p-2 border border-color-three/20 dark:border-[#2a2a2a] rounded-md"
              />
              {formErrors.brand && <p className="text-red-500 text-xs mt-1">{formErrors.brand}</p>}
            </div>
            <div>
              <label
                htmlFor="price"
                className="block text-sm font-medium text-color-three dark:text-stone-300 mb-1"
              >
                Precio (Opcional)
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <span className="text-stone-500 dark:text-[#a0a0a0] sm:text-sm">
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
                  className="input-primary w-full p-2 pl-8 border border-color-three/20 dark:border-[#2a2a2a] rounded-md"
                />
              </div>
              {formErrors.price && <p className="text-red-500 text-xs mt-1">{formErrors.price}</p>}
            </div>
            <div>
              <label
                htmlFor="cantidad"
                className="block text-sm font-medium text-color-three dark:text-stone-300 mb-1"
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
                className="input-primary w-full p-2 border border-color-three/20 dark:border-[#2a2a2a] rounded-md"
              />
              {formErrors.cantidad && <p className="text-red-500 text-xs mt-1">{formErrors.cantidad}</p>}
            </div>

            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-color-three dark:text-stone-300 mb-1"
              >
                Descripción
              </label>
              <textarea
                name="description"
                id="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className="input-primary w-full p-2 border border-color-three/20 dark:border-[#2a2a2a] rounded-md"
              />
              {formErrors.description && <p className="text-red-500 text-xs mt-1">{formErrors.description}</p>}
            </div>
            <div className="pt-4 border-t border-color-three/10 dark:border-[#2a2a2a]">
              <div className="flex justify-between items-center mb-4">
                <label className="block text-sm font-semibold text-color-three dark:text-white">
                  Campos Personalizados (Dinámicos)
                </label>
                <button
                  type="button"
                  onClick={() => setCustomFields([...customFields, { id: `cf-${Date.now()}`, key: "", value: "" }])}
                  className="text-xs text-color-one dark:text-white hover:underline focus:outline-none bg-color-three/10 dark:bg-[#1a1a1a] px-3 py-1.5 rounded-full"
                >
                  + Añadir Campo Libre
                </button>
              </div>
              {customFields.length === 0 ? (
                <p className="text-xs text-stone-500 mb-4">No hay campos extra automáticos para este producto. Pulsa en "+ Añadir" si necesitas (ej. Voltaje, Detalles).</p>
              ) : (
                <div className="space-y-3 mb-4">
                  {customFields.map((cf, idx) => (
                    <div key={cf.id} className="flex gap-3 items-start">
                      <div className="w-1/3">
                        <input
                          type="text"
                          placeholder="Propiedad (ej. Material)"
                          value={cf.key}
                          onChange={e => {
                            const updated = [...customFields];
                            updated[idx].key = e.target.value;
                            setCustomFields(updated);
                          }}
                          className="input-primary w-full p-2 border border-color-three/20 dark:border-[#2a2a2a] rounded-md text-sm"
                        />
                      </div>
                      <div className="flex-1">
                        <input
                          type="text"
                          placeholder="Valor (ej. Algodón)"
                          value={cf.value}
                          onChange={e => {
                            const updated = [...customFields];
                            updated[idx].value = e.target.value;
                            setCustomFields(updated);
                          }}
                          className="input-primary w-full p-2 border border-color-three/20 dark:border-[#2a2a2a] rounded-md text-sm"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const updated = [...customFields];
                          updated.splice(idx, 1);
                          setCustomFields(updated);
                        }}
                        className="text-red-500 hover:text-red-700 p-2 mt-0.5"
                        title="Quitar campo"
                      >
                        <CloseIcon className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
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
                className="bg-color-three/5 dark:bg-[#0f0f0f] text-color-three dark:text-[#a0a0a0] font-medium py-2 px-4 rounded-lg border border-color-three/10 dark:border-[#2a2a2a] hover:bg-color-three/10 dark:hover:bg-[#2a2a2a] transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isProductLoading}
                className="buttom-shop font-bold py-2 px-6 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
          className="absolute top-4 right-4 text-color-three dark:text-[#a0a0a0] hover:text-color-one dark:hover:text-white z-10 transition-colors rounded-full focus:outline-none focus:ring-4 focus:ring-offset-2 focus:ring-color-one"
          aria-label="Cerrar formulario"
        >
          <CloseIcon className="w-8 h-8" />
        </button>
      </div>

    </div>
  );
};

export default AdminFormModal;
