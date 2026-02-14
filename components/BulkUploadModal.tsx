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
  DownloadIcon,
} from "./Icons";
import JSZip from "jszip";

interface BulkUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBulkSaveComplete: (newGarments: Garment[]) => void;
}

const DEFAULT_PROMPT = `Fotografía de moda de alta calidad: elimina el fondo y el colgador por completo. Compón el vestido sobre una modelo peruana realista de talla 0. De pie, elegante con una cartera de mano, en una moderna y lujosa terraza en la azotea de San Isidro, Lima.

Entorno e iluminación: resaltar ala modelo y el vestido para que se vea de la mejor manera y con el mejor contraste, con luces focalizadas como estudio hacia la modelo. Es la «hora azul» (crepúsculo). El fondo muestra una vista panorámica de las luces de la ciudad (efecto bokeh) y las siluetas oscuras de las montañas en la distancia. Hay una cálida iluminación artificial ámbar que proviene de las lámparas del suelo de la terraza, que proyecta un suave resplandor dorado en la parte inferior del vestido y el suelo de baldosas, creando un contraste con el fresco cielo azul.

Estilo: Fotografía cinematográfica, alta costura, enfoque nítido en el vestido, poca profundidad de campo, resolución 8k. --ar 4:5`;

type UploadStatus =
  | "pending"
  | "uploading"
  | "processing"
  | "analyzed"
  | "edited"
  | "ready"
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
  const [iaPrompt, setIaPrompt] = useState<string>(DEFAULT_PROMPT);
  const [isEditingMassively, setIsEditingMassively] = useState(false);
  const [isRecommendingPrompt, setIsRecommendingPrompt] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const [imageUsage, setImageUsage] = useState({
    promptTokens: 0,
    candidatesTokens: 0,
  });

  const [textUsage, setTextUsage] = useState({
    promptTokens: 0,
    candidatesTokens: 0,
  });

  const [imageEditQuote, setImageEditQuote] = useState<{ inputTokens: number; outputTokens: number; estimatedCostUsd: number } | null>(null);
  const [autocompletionQuote, setAutocompletionQuote] = useState<{ inputTokens: number; outputTokens: number; estimatedCostUsd: number } | null>(null);
  const [isQuotingImageEdit, setIsQuotingImageEdit] = useState(false);
  const [isQuotingAutocompletion, setIsQuotingAutocompletion] = useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setIsRendered(true);
      setTimeout(() => setIsVisible(true), 10);
    } else {
      setIsVisible(false);
      // Abortar cualquier petición en curso al cerrar
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      const timer = setTimeout(() => {
        setIsRendered(false);
        // Reset state when modal is completely hidden
        if (files.length > 0) {
          files.forEach(f => URL.revokeObjectURL(f.previewUrl));
        }
        setFiles([]);
        setImageEditQuote(null);
        setAutocompletionQuote(null);
        setImageUsage({ promptTokens: 0, candidatesTokens: 0 });
        setTextUsage({ promptTokens: 0, candidatesTokens: 0 });
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
      .filter((file) => file.type.startsWith("video/") || file.type.startsWith("image/"))
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

  const handleQuoteImageEdit = async () => {
    const imageFiles = files.filter(f => f.file.type.startsWith("image/") && f.status !== "completed");
    if (imageFiles.length === 0) return;

    setIsQuotingImageEdit(true);
    let totalInputTokens = 0;
    let totalOutputTokens = 0;
    let totalCost = 0;

    try {
      // Tomamos una muestra o cotizamos todos dependiendo del volumen
      // Para efectos de esta función, cotizamos todos los que se van a procesar
      const results = await Promise.all(imageFiles.map(async (file) => {
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve((reader.result as string).split(",")[1]);
          reader.onerror = reject;
          reader.readAsDataURL(file.file);
        });

        const response = await fetch("/api/ia/count-tokens", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            imageBase64: base64,
            prompt: iaPrompt,
            model: 'gemini-2.5-flash-image'
          })
        });

        if (!response.ok) return null;
        const result = await response.json();
        return result.data || result;
      }));

      results.forEach(res => {
        if (res) {
          const inputTokens = res.totalTokens || 0;
          // Estimación de respuesta: doble de entrada + 25%
          const estimatedResponseTokens = (inputTokens * 2) * 1.25;

          totalInputTokens += inputTokens;
          totalOutputTokens += estimatedResponseTokens;

          // Cálculo manual: Input $0.30/1M, Output $30.00/1M (Imagen)
          const inputCost = inputTokens * (0.30 / 1000000);
          const outputCost = estimatedResponseTokens * (30.00 / 1000000);
          totalCost += (inputCost + outputCost);
        }
      });

      setImageEditQuote({ inputTokens: totalInputTokens, outputTokens: totalOutputTokens, estimatedCostUsd: totalCost });
    } catch (error) {
      console.error("Error quoting image edit:", error);
    } finally {
      setIsQuotingImageEdit(false);
    }
  };

  const handleQuoteAutocompletion = async () => {
    const pendingFiles = files.filter(f => f.status === "pending" || f.status === "error" || f.status === "edited");
    if (pendingFiles.length === 0) return;

    setIsQuotingAutocompletion(true);
    let totalInputTokens = 0;
    let totalOutputTokens = 0;
    let totalCost = 0;

    const analysisPrompt = `Analiza el vestido en esta imagen. Responde SOLO con JSON válido en español.\n\nJSON requerido:\n{\n  "title": "nombre creativo del vestido",\n  "brand": "Identifica la marca",\n  "color": "color principal",\n  "size": "Identifica la talla",\n  "description": "breve descripción",\n  "price": 0,\n  "material": "No identificable",\n  "occasion": "Boda",\n  "style_notes": "detalles"\n}`;

    try {
      const results = await Promise.all(pendingFiles.map(async (file) => {
        let base64Image = "";
        if (file.file.type.startsWith("image/")) {
          base64Image = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve((reader.result as string).split(",")[1]);
            reader.onerror = reject;
            reader.readAsDataURL(file.file);
          });
        } else {
          const videoElement = file.videoRef.current;
          if (videoElement) {
            base64Image = await captureFrame(videoElement);
          }
        }

        if (!base64Image) return null;

        const response = await fetch("/api/ia/count-tokens", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            imageBase64: base64Image,
            prompt: analysisPrompt,
            model: 'gemini-2.5-flash-image'
          })
        });

        if (!response.ok) return null;
        const result = await response.json();
        return result.data || result;
      }));

      results.forEach(res => {
        if (res) {
          const inputTokens = res.totalTokens || 0;
          // Estimación de respuesta para Texto: 75% de la entrada (el JSON es más pequeño que la imagen)
          const estimatedResponseTokens = inputTokens * 0.75;

          totalInputTokens += inputTokens;
          totalOutputTokens += estimatedResponseTokens;

          // Cálculo manual: Input $0.30/1M, Output $2.50/1M (Texto)
          const inputCost = inputTokens * (0.30 / 1000000);
          const outputCost = estimatedResponseTokens * (2.50 / 1000000);
          totalCost += (inputCost + outputCost);
        }
      });

      setAutocompletionQuote({ inputTokens: totalInputTokens, outputTokens: totalOutputTokens, estimatedCostUsd: totalCost });
    } catch (error) {
      console.error("Error quoting autocompletion:", error);
    } finally {
      setIsQuotingAutocompletion(false);
    }
  };

  const handleMassiveImageEdit = async () => {
    const imageFiles = files.filter(f => f.file.type.startsWith("image/") && f.status !== "completed");
    if (imageFiles.length === 0) return;

    setIsEditingMassively(true);
    const BATCH_SIZE = 5;

    // Crear un nuevo controlador para este proceso
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    for (let i = 0; i < imageFiles.length; i += BATCH_SIZE) {
      const batch = imageFiles.slice(i, i + BATCH_SIZE);
      await Promise.all(batch.map(async (file) => {
        try {
          updateFileState(file.id, { status: "processing", errorMessage: undefined });

          const base64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve((reader.result as string).split(",")[1]);
            reader.onerror = reject;
            reader.readAsDataURL(file.file);
          });

          const response = await fetch("/api/ia/image-to-image", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              imageBase64: base64,
              prompt: iaPrompt
            }),
            signal,
          });

          if (!response.ok) throw new Error("Error en edición IA");

          const result = await response.json();
          // El API puede devolver la imagen en result.imageBase64 o en generated_images[0]
          const rawBase64 = result.imageBase64 || (result.generated_images && result.generated_images[0]);

          if (rawBase64) {
            // Verificar si ya tiene el prefijo de data URI
            const hasPrefix = rawBase64.startsWith('data:');
            const newUrl = hasPrefix ? rawBase64 : `data:image/png;base64,${rawBase64}`;

            // Convertir base64 a Blob de forma eficiente para recrear el File
            const responseBlob = await fetch(newUrl);
            const blob = await responseBlob.blob();

            // Reemplazamos el archivo original por la versión editada por IA
            const newFileName = file.file.name.replace(/\.[^/.]+$/, "") + "_ai.png";
            const editedFile = new File([blob], newFileName, { type: 'image/png' });

            updateFileState(file.id, {
              file: editedFile,
              previewUrl: newUrl,
              status: "edited"
            });

            // Actualizar uso de tokens de imagen
            if (result.usage) {
              setImageUsage(prev => ({
                promptTokens: prev.promptTokens + (result.usage.promptTokens || 0),
                candidatesTokens: prev.candidatesTokens + (result.usage.candidatesTokens || 0),
              }));
            }
          } else {
            throw new Error("El API no devolvió ninguna imagen válida");
          }
        } catch (error) {
          console.error("Error editing image:", error);
          updateFileState(file.id, {
            status: "error",
            errorMessage: "Fallo en la edición creativa con IA"
          });
        }
      }));
    }
    setIsEditingMassively(false);
  };

  const handleRecommendPrompt = async () => {
    const firstImage = files.find(f => f.file.type.startsWith("image/"));
    if (!firstImage) return;

    setIsRecommendingPrompt(true);
    try {
      // Usar el controlador actual o crear uno
      if (!abortControllerRef.current) abortControllerRef.current = new AbortController();
      const signal = abortControllerRef.current.signal;

      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string).split(",")[1]);
        reader.onerror = reject;
        reader.readAsDataURL(firstImage.file);
      });

      const response = await fetch("/api/ia/analyze-garment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: base64,
          prompt: `Analiza este vestido de Womanity Boutique y crea un PROMPT de edición (image-to-image). 
          REGLA DE ORO: PRESERVACIÓN TOTAL de la prenda (diseño, color, texturas y detalles intactos).
          Instrucciones: 
          1. No debe de describir el vestido para que la imagen no cambie y se mantenga la prenda original.
          2. Fondo: Terraza de lujo en San Isidro, Lima, skyline con efecto bokeh (hora azul).
          3. Modelo: Mujer peruana elegante, pose natural.
          4. Eliminar colgador y fondo actual.
          5. Estilo: Fotografía de alta costura, 8k, --ar 4:5.
          6. "recommended_prompt": tiene que estar en español.
          Responde SOLO JSON: { "recommended_prompt": "texto aquí" }`
        }),
        signal,
      });

      if (!response.ok) throw new Error("Error analizando imagen");

      const result = await response.json();

      // Acumular tokens de la recomendación
      if (result.usage) {
        setTextUsage(prev => ({
          promptTokens: prev.promptTokens + (result.usage.promptTokens || 0),
          candidatesTokens: prev.candidatesTokens + (result.usage.candidatesTokens || 0),
        }));
      }

      // La IA devuelve el prompt recomendado en el campo específico
      const recommendedPrompt = result.recommended_prompt || result.description || "";
      if (recommendedPrompt) {
        setIaPrompt(recommendedPrompt);
      }
    } catch (error) {
      console.error("Error recommending prompt:", error);
    } finally {
      setIsRecommendingPrompt(false);
    }
  };

  const processQueue = async () => {
    setIsProcessing(true);
    // Crear un nuevo controlador para este proceso
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    // Obtenemos solo los que están pendientes, en error o editados para procesar
    const pendingFiles = files.filter(f => f.status === "pending" || f.status === "error" || f.status === "edited");

    for (const file of pendingFiles) {
      try {
        // Analizar con IA (No necesitamos subir el video primero, usamos el elemento local)
        updateFileState(file.id, { status: "processing", errorMessage: undefined });

        let base64Image = "";

        // Si es imagen, leer directamente a base64
        if (file.file.type.startsWith("image/")) {
          base64Image = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve((reader.result as string).split(",")[1]);
            reader.onerror = reject;
            reader.readAsDataURL(file.file);
          });
        }
        // Si es video, capturar un frame
        else {
          const videoElement = file.videoRef.current;
          if (!videoElement) {
            throw new Error("El elemento de video no está disponible para captura.");
          }

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
              setTimeout(() => reject(new Error("Timeout cargando video local.")), 15000);
            });
          }
          base64Image = await captureFrame(videoElement);
        }

        // Llamar al API route de Next.js para análisis de prenda
        const response = await fetch("/api/ia/analyze-garment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            imageBase64: base64Image,
            prompt: `Analiza el vestido en esta imagen. Responde SOLO con JSON válido en español.\n\nJSON requerido:\n{\n  "title": "nombre creativo del vestido",\n  "brand": "Identifica la marca",\n  "color": "color principal",\n  "size": "Identifica la talla",\n  "description": "breve descripción",\n  "price": 0,\n  "material": "No identificable",\n  "occasion": "Boda",\n  "style_notes": "detalles"\n}`
          }),
          signal,
        });

        if (!response.ok) {
          throw new Error("Error al analizar la prenda con IA");
        }

        const result = await response.json();

        // Acumular tokens del autocompletado con IA (Texto)
        if (result.usage) {
          setTextUsage(prev => ({
            promptTokens: prev.promptTokens + (result.usage.promptTokens || 0),
            candidatesTokens: prev.candidatesTokens + (result.usage.candidatesTokens || 0),
          }));
        }

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

              return {
                ...f,
                garmentData: updatedData,
                status: (f.status === "edited" ? "ready" : "analyzed") as UploadStatus,
                imagen_principal_base64: base64Image // Guardar el frame capturado
              };
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

  const handleDownloadZip = async () => {
    const zip = new JSZip();
    const folder = zip.folder("imagenes_vestidos_ia");

    if (!folder) return;

    for (const f of files) {
      if (f.file.type.startsWith("image/")) {
        const content = await f.file.arrayBuffer();
        folder.file(f.file.name, content);
      }
    }

    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "vestidos_ia_womanity.zip";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
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
            const isImage = f.file.type.startsWith("image/");
            const formData = new FormData();

            if (isImage) {
              // Si es una imagen, la enviamos directamente como imagen_principal
              formData.append("image_principal", f.file);
            } else {
              // Si es un video, enviamos el archivo de video
              formData.append("video", f.file);

              // Y si la IA capturó un frame, lo enviamos como imagen_principal
              if ((f as any).imagen_principal_base64) {
                const byteString = atob((f as any).imagen_principal_base64);
                const ab = new ArrayBuffer(byteString.length);
                const ia = new Uint8Array(ab);
                for (let i = 0; i < byteString.length; i++) {
                  ia[i] = byteString.charCodeAt(i);
                }
                const blob = new Blob([ab], { type: 'image/jpeg' });
                formData.append("image_principal", blob, "principal.jpg");
              }
            }

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

  const pendingAutocompleteCount = files.filter((f) =>
    f.status === "pending" || f.status === "error" || f.status === "edited"
  ).length;

  const imagesToEditCount = files.filter(f =>
    f.file.type.startsWith("image/") &&
    (f.status === "pending" || f.status === "error" || f.status === "analyzed" || f.status === "edited")
  ).length;

  return (
    <div
      className={`fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 transition-opacity duration-300 ease-in-out ${isVisible ? 'opacity-100' : 'opacity-0'}`}
      onClick={() => {
        if (isProcessing || isEditingMassively || isSaving) return;
        onClose();
      }}
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
            Carga Masiva de Multimedia
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
              <p className="font-semibold text-stone-700 dark:text-stone-300">Arrastra y suelta tus videos e imágenes aquí</p>
              <p className="text-sm">o</p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="mt-2 text-sky-600 dark:text-sky-400 font-semibold hover:underline"
              >
                Selecciona tus archivos
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Sección de Edición Creativa Masiva */}
              <div className="bg-stone-100 dark:bg-stone-800/50 p-4 rounded-xl border border-stone-200 dark:border-stone-700 shadow-inner space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs font-bold text-stone-600 dark:text-stone-400 uppercase tracking-widest flex items-center gap-2">
                    <SparklesIcon className="w-4 h-4 text-sky-500" />
                    Edición Creativa Masiva (Solo Imágenes)
                  </h3>
                  <div className="flex items-center gap-4">
                    {(imageUsage.promptTokens > 0 || textUsage.promptTokens > 0) && (
                      <div className="flex items-center gap-2 px-2 py-1 bg-stone-200 dark:bg-stone-900 rounded-lg border border-stone-300 dark:border-stone-700 animate-in fade-in slide-in-from-right-2">
                        <div className="flex flex-col items-center px-2 border-r border-stone-300 dark:border-stone-700">
                          <span className="text-[9px] text-stone-500 uppercase font-bold text-center">INPUT</span>
                          <span className="text-[10px] font-mono font-bold text-sky-600 dark:text-sky-400">
                            {(imageUsage.promptTokens + textUsage.promptTokens).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex flex-col items-center px-2 border-r border-stone-300 dark:border-stone-700">
                          <span className="text-[9px] text-stone-500 uppercase font-bold text-center">OUTPUT</span>
                          <span className="text-[10px] font-mono font-bold text-indigo-600 dark:text-indigo-400">
                            {(imageUsage.candidatesTokens + textUsage.candidatesTokens).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex flex-col items-center px-2">
                          <span className="text-[9px] text-stone-500 uppercase font-bold text-center">COSTO TOTAL (USD)</span>
                          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                            ${(
                              (imageUsage.promptTokens * (0.30 / 1000000)) +
                              (imageUsage.candidatesTokens * (30.00 / 1000000)) +
                              (textUsage.promptTokens * (0.30 / 1000000)) +
                              (textUsage.candidatesTokens * (2.50 / 1000000))
                            ).toFixed(5)}
                          </span>
                        </div>
                      </div>
                    )}
                    <button
                      onClick={handleRecommendPrompt}
                      disabled={isRecommendingPrompt || files.filter(f => f.file.type.startsWith("image/")).length === 0}
                      className="text-[10px] text-sky-600 dark:text-sky-400 font-bold hover:underline flex items-center gap-1 disabled:opacity-50"
                    >
                      {isRecommendingPrompt ? <SpinnerIcon className="w-3 h-3 animate-spin" /> : <SparklesIcon className="w-3 h-3" />}
                      Recomendar Prompt
                    </button>
                  </div>
                </div>

                <textarea
                  value={iaPrompt}
                  onChange={(e) => setIaPrompt(e.target.value)}
                  className="w-full p-3 text-xs bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-lg focus:ring-1 focus:ring-sky-500 min-h-[100px] resize-none text-stone-700 dark:text-stone-300 transition-all"
                  placeholder="Escribe aquí las instrucciones para la IA... (Ej: Pon el vestido en una modelo en la playa)"
                />

                <div className="flex flex-col gap-2">
                  <button
                    onClick={handleMassiveImageEdit}
                    disabled={isEditingMassively || imagesToEditCount === 0}
                    className={`w-full py-3 rounded-lg font-bold text-white transition-all flex items-center justify-center gap-2 text-sm shadow-sm active:scale-[0.98] ${isEditingMassively || imagesToEditCount === 0
                      ? 'bg-stone-300 dark:bg-stone-800 text-stone-500 cursor-not-allowed border border-stone-200 dark:border-stone-700'
                      : 'bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 shadow-sky-500/20'
                      }`}
                  >
                    {isEditingMassively ? (
                      <SpinnerIcon className="w-5 h-5 animate-spin" />
                    ) : (
                      <SparklesIcon className="w-5 h-5" />
                    )}
                    {isEditingMassively ? 'Procesando Imágenes con IA...' : `Ejecutar Edición de imágenes IA (${imagesToEditCount})`}
                  </button>

                  <div className="flex items-center justify-between px-1">
                    <button
                      onClick={handleQuoteImageEdit}
                      disabled={isQuotingImageEdit || imagesToEditCount === 0 || isEditingMassively}
                      className="text-[11px] text-stone-500 hover:text-stone-800 dark:hover:text-stone-300 transition-colors flex items-center gap-1 disabled:opacity-50"
                    >
                      {isQuotingImageEdit ? <SpinnerIcon className="w-3 h-3 animate-spin" /> : <DownloadIcon className="w-3 h-3 rotate-180" />}
                      {isQuotingImageEdit ? 'Cotizando...' : 'Cotizar costo estimado'}
                    </button>

                    {imageEditQuote && (
                      <div className="flex flex-col items-end text-[10px] animate-in fade-in slide-in-from-bottom-1">
                        <div className="flex gap-2">
                          <span className="text-stone-500">Envío: <span className="font-mono font-bold text-sky-600">{imageEditQuote.inputTokens.toLocaleString()}</span></span>
                          <span className="text-stone-500">Respuesta (est.): <span className="font-mono font-bold text-indigo-600">{imageEditQuote.outputTokens.toLocaleString()}</span></span>
                        </div>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">Costo total est: ${imageEditQuote.estimatedCostUsd.toFixed(5)} USD</span>
                      </div>
                    )}
                  </div>
                </div>

                {files.filter(f => f.file.type.startsWith("image/")).length === 0 && (
                  <p className="text-[10px] text-stone-500 text-center italic">
                    * Sube al menos una imagen para habilitar la edición creativa.
                  </p>
                )}
              </div>

              <div className="space-y-4">
                {files.map((file) => (
                  <div
                    key={file.id}
                    className="bg-white dark:bg-stone-800 p-4 rounded-lg shadow-sm border border-stone-200 dark:border-stone-700 grid grid-cols-1 md:grid-cols-3 gap-4"
                  >
                    <div className="w-full aspect-[9/16] bg-black rounded-md overflow-hidden relative shadow-inner">
                      {file.file.type.startsWith("image/") ? (
                        <img
                          src={file.previewUrl}
                          alt={file.file.name}
                          className="w-full h-full object-cover transition-all duration-500"
                        />
                      ) : (
                        <video
                          ref={file.videoRef}
                          src={file.previewUrl}
                          muted
                          playsInline
                          className="w-full h-full object-cover transition-all duration-500"
                          crossOrigin="anonymous"
                        />
                      )}

                      {/* overlays premium */}
                      <ScanningOverlay status={file.status} />


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
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="video/*,image/*"
            onChange={(e) => handleFileSelect(e)}
            className="hidden"
          />
        </main>

        <footer className="p-4 border-t border-stone-200 dark:border-stone-800 bg-white/50 dark:bg-stone-900/50 backdrop-blur-sm flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 sm:gap-2">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing || isEditingMassively || isSaving}
              className="flex-grow sm:flex-grow-0 bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-200 font-medium py-2 px-4 rounded-lg border border-stone-300 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors text-sm disabled:opacity-50"
            >
              + Añadir más
            </button>
            <button
              onClick={handleDownloadZip}
              disabled={files.filter(f => f.file.type.startsWith("image/")).length === 0}
              className="p-2 bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 rounded-lg border border-stone-200 dark:border-stone-700 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors disabled:opacity-50"
              title="Descargar todas las imágenes editadas en ZIP"
            >
              <DownloadIcon className="w-5 h-5" />
            </button>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
            <div className="flex flex-col items-end">
              {autocompletionQuote && (
                <div className="text-[10px] mb-1 mr-1 animate-in fade-in slide-in-from-bottom-1 flex flex-col items-end">
                  <div className="flex gap-2 font-mono">
                    <span className="text-stone-500">Envío: <span className="text-sky-600 font-bold">{autocompletionQuote.inputTokens.toLocaleString()}</span></span>
                    <span className="text-stone-500">Respuesta (est.): <span className="text-indigo-600 font-bold">{autocompletionQuote.outputTokens.toLocaleString()}</span></span>
                  </div>
                  <span className="font-bold text-emerald-600 underline">Costo Total: ${autocompletionQuote.estimatedCostUsd.toFixed(5)} USD</span>
                </div>
              )}
              <div className="flex gap-2 w-full">
                <button
                  onClick={handleQuoteAutocompletion}
                  disabled={isQuotingAutocompletion || pendingAutocompleteCount === 0 || isProcessing}
                  className="p-2 bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 rounded-lg border border-stone-200 dark:border-stone-700 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors disabled:opacity-50"
                  title="Cotizar autocompletado"
                >
                  <DownloadIcon className="w-5 h-5 rotate-180" />
                </button>
                <button
                  onClick={processQueue}
                  disabled={isProcessing || pendingAutocompleteCount === 0}
                  className="w-full sm:w-auto bg-stone-800 dark:bg-stone-100 text-white dark:text-stone-900 font-medium py-2 px-4 rounded-lg hover:bg-stone-700 dark:hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm inline-flex items-center justify-center gap-2 shadow-sm"
                >
                  {isProcessing ? (
                    <SpinnerIcon className="w-4 h-4 animate-spin" />
                  ) : (
                    <SparklesIcon className="w-4 h-4" />
                  )}
                  {isProcessing
                    ? "Autocompletando..."
                    : `Autocompletar (${pendingAutocompleteCount}) con IA`}
                </button>
              </div>
            </div>
            <button
              onClick={handleSaveAll}
              disabled={isSaving || isProcessing || isEditingMassively || readyToSaveCount === 0}
              className="w-full sm:w-auto bg-sky-600 dark:bg-sky-500 text-white font-medium py-2 px-4 rounded-lg hover:bg-sky-700 dark:hover:bg-sky-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm shadow-sm h-[38px]"
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
    analyzed: {
      icon: <CheckCircleIcon className="w-4 h-4" />,
      color: "bg-sky-500/80",
    },
    edited: {
      icon: <CheckCircleIcon className="w-4 h-4" />,
      color: "bg-indigo-500/80",
    },
    ready: {
      icon: <CheckCircleIcon className="w-4 h-4" />,
      color: "bg-teal-500/80",
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
        {status === "processing" ? "Análisis IA"
          : status === "analyzed" ? "Datos Listos"
            : status === "edited" ? "Imagen Lista"
              : status === "ready" ? "Todo Listo"
                : status === "completed" ? "Guardado"
                  : status === "uploading" ? "Subiendo"
                    : status === "error" ? "Error" : ""}
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
