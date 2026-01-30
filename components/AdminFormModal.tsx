import React, { useState, useEffect, useRef } from 'react';
import type { Garment } from '../types';
import { iaService } from '../services/iaService';
import { useProducts } from '../hooks/useProducts';
import { CloseIcon, SparklesIcon, SpinnerIcon } from './Icons';

interface AdminFormModalProps {
  garment: Garment | null;
  onClose: () => void;
  onSave?: (product: Garment) => void;
}

const AdminFormModal: React.FC<AdminFormModalProps> = ({ garment, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    title: '',
    brand: '',
    size: '',
    color: '',
    description: '',
    price: '',
    material: '',
    occasion: '',
    style_notes: '',
    videoUrl: '', // URL manual de video como alternativa
  });
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const { createProduct, updateProduct, isLoading: isProductLoading } = useProducts();

  const firstInputRef = useRef<HTMLInputElement>(null);
  const videoPreviewRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (garment) {
      setFormData({
        title: garment.title,
        brand: garment.brand,
        size: garment.size,
        color: garment.color,
        description: garment.description,
        price: garment.price ? String(garment.price) : '',
        material: garment.material || '',
        occasion: garment.occasion || '',
        style_notes: garment.style_notes || '',
        videoUrl: garment.videoUrl || '',
      });
      setPreviewUrl(garment.videoUrl);
    }
    firstInputRef.current?.focus();
  }, [garment]);
  
  useEffect(() => {
    const currentPreviewUrl = previewUrl;
    return () => {
      if (currentPreviewUrl && currentPreviewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(currentPreviewUrl);
      }
    };
  }, [previewUrl]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setVideoFile(file);
      const newPreviewUrl = URL.createObjectURL(file);
      setPreviewUrl(newPreviewUrl);
      // Limpiar URL manual cuando se sube un archivo
      setFormData(prev => ({ ...prev, videoUrl: '' }));
    }
  };

  const handleVideoUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setFormData(prev => ({ ...prev, videoUrl: url }));
    if (url) {
      setPreviewUrl(url);
      // Limpiar archivo cuando se ingresa URL manual
      setVideoFile(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!previewUrl && !videoFile && !formData.videoUrl) {
        console.log('Por favor, sube un video o proporciona una URL de video.');
        return;
    }
    
    const priceAsNumber = formData.price ? parseFloat(formData.price) : undefined;
    if (formData.price && isNaN(priceAsNumber!)) {
        console.log('Por favor, introduce un precio válido.');
        return;
    }

    const dataToSave = {
        title: formData.title,
        brand: formData.brand,
        size: formData.size,
        color: formData.color,
        description: formData.description,
        price: priceAsNumber,
        material: formData.material,
        occasion: formData.occasion,
        style_notes: formData.style_notes,
        ...(formData.videoUrl && !videoFile ? { videoUrl: formData.videoUrl } : {}),
    };

    // Determinar si es crear o actualizar
    const savePromise = (garment && garment.id)
      ? updateProduct(garment.id, dataToSave)
      : createProduct(dataToSave, videoFile);

    savePromise
      .then((product) => {
        console.log('[AdminFormModal] Producto guardado:', product);
        console.log('Producto guardado exitosamente');
        if (onSave) {
          try {
            onSave(product);
          } catch (callbackError) {
            console.error('Error en callback onSave:', callbackError);
          }
        }
        // Asegurar que el modal se cierre
        setTimeout(() => onClose(), 100);
      })
      .catch((error) => {
        console.error('Error al guardar producto:', error);
        console.log(`Error al guardar el producto: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      });
  };
  
  // Función helper para capturar un frame del video
  const captureFrame = (videoEl: HTMLVideoElement): Promise<string> => {
    return new Promise((resolve, reject) => {
      const onSeeked = () => {
        videoEl.removeEventListener('seeked', onSeeked);
        const canvas = document.createElement('canvas');
        canvas.width = videoEl.videoWidth;
        canvas.height = videoEl.videoHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error("No se pudo obtener el contexto del canvas"));
        
        ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
        try {
          const base64ImageData = canvas.toDataURL('image/jpeg').split(',')[1];
          resolve(base64ImageData);
        } catch(e) {
          reject(e);
        }
      };
      
      videoEl.addEventListener('seeked', onSeeked, { once: true });
      videoEl.addEventListener('error', (e) => reject(new Error(`Error en el elemento de video: ${e}`)), { once: true });
      
      videoEl.currentTime = Math.min(1, videoEl.duration / 2);
    });
  };

  const handleAiAutocomplete = async () => {
    if (!videoPreviewRef.current || !previewUrl) {
      console.log("No hay un video para analizar.");
      return;
    }

    setIsAiLoading(true);

    try {
      // Verificar que el video esté cargado
      if (videoPreviewRef.current.readyState < 2) {
        await new Promise((resolve, reject) => {
          videoPreviewRef.current!.addEventListener('loadeddata', resolve, { once: true });
          videoPreviewRef.current!.addEventListener('error', () => reject(new Error("Error al cargar los datos del video.")), { once: true });
        });
      }

      // Capturar un frame del video
      const base64Image = await captureFrame(videoPreviewRef.current);
      
      // Llamar a la API del servicio de IA
      const result = await iaService.analyzeGarmentFromBase64(base64Image);
      
      // Mostrar el resultado en consola
      console.log("Resultado del análisis de IA:", result);
      
      // Autocompletar los campos con la información del análisis
      setFormData(prev => {
        const newPrice = result.price;
        let priceString = prev.price; // Mantener el valor actual por defecto

        if (typeof newPrice === 'number' && !isNaN(newPrice) && newPrice > 0) {
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
      console.error("Error con IA:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      // Mensajes más específicos según el tipo de error
      if (errorMessage.includes("conexión") || errorMessage.includes("fetch")) {
        console.log("Error de conexión: Verifica que el servicio de IA esté disponible y que VITE_IA_URL esté configurado correctamente.");
      } else if (errorMessage.includes("cargando") || errorMessage.includes("503")) {
        console.log("El modelo de IA está iniciando. Por favor, espera unos segundos e intenta de nuevo.");
      } else if (errorMessage.includes("video")) {
        console.log("Error: No se pudo procesar el video. Asegúrate de que el video esté cargado correctamente.");
      } else {
        console.log(`Error al analizar con IA: ${errorMessage}. Por favor, revisa la consola para más detalles.`);
      }
    } finally {
      setIsAiLoading(false);
    }
  };

  const isAiDisabled = !previewUrl || isAiLoading;

  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="form-modal-title"
    >
      <div
        className="relative bg-stone-50 dark:bg-stone-800 rounded-lg shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-modal-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-8">
            <h2 id="form-modal-title" className="text-3xl font-semibold text-stone-900 dark:text-stone-100 mb-6">
                {garment ? 'Editar Prenda' : 'Añadir Nueva Prenda'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="title" className="block text-sm font-medium text-stone-600 dark:text-stone-300 mb-1">Título</label>
                    <input ref={firstInputRef} type="text" name="title" id="title" value={formData.title} onChange={handleChange} required className="w-full p-2 border border-stone-300 dark:border-stone-600 rounded-md focus:ring-stone-500 dark:focus:ring-stone-400 focus:border-stone-500 dark:focus:border-stone-500 bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100" />
                </div>
                <div>
                    <label htmlFor="brand" className="block text-sm font-medium text-stone-600 dark:text-stone-300 mb-1">Marca</label>
                    <input type="text" name="brand" id="brand" value={formData.brand} onChange={handleChange} required className="w-full p-2 border border-stone-300 dark:border-stone-600 rounded-md focus:ring-stone-500 dark:focus:ring-stone-400 focus:border-stone-500 dark:focus:border-stone-500 bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                      <label htmlFor="size" className="block text-sm font-medium text-stone-600 dark:text-stone-300 mb-1">Talla</label>
                      <input type="text" name="size" id="size" value={formData.size} onChange={handleChange} required className="w-full p-2 border border-stone-300 dark:border-stone-600 rounded-md focus:ring-stone-500 dark:focus:ring-stone-400 focus:border-stone-500 dark:focus:border-stone-500 bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100" />
                  </div>
                  <div>
                      <label htmlFor="color" className="block text-sm font-medium text-stone-600 dark:text-stone-300 mb-1">Color</label>
                      <input type="text" name="color" id="color" value={formData.color} onChange={handleChange} required className="w-full p-2 border border-stone-300 dark:border-stone-600 rounded-md focus:ring-stone-500 dark:focus:ring-stone-400 focus:border-stone-500 dark:focus:border-stone-500 bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100" />
                  </div>
                </div>
                <div>
                  <label htmlFor="price" className="block text-sm font-medium text-stone-600 dark:text-stone-300 mb-1">Precio (Opcional)</label>
                  <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                          <span className="text-stone-500 dark:text-stone-400 sm:text-sm">S/</span>
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
                </div>
                 <div>
                    <label htmlFor="videoFile" className="block text-sm font-medium text-stone-600 dark:text-stone-300 mb-1">Video</label>
                    <div className="w-full space-y-3">
                        <div>
                            <label htmlFor="videoFile" className="block text-xs text-stone-500 dark:text-stone-400 mb-1">Subir archivo de video</label>
                            <input 
                                type="file" 
                                name="videoFile" 
                                id="videoFile" 
                                accept="video/*" 
                                onChange={handleFileChange} 
                                className="block w-full text-sm text-stone-600 dark:text-stone-300
                                file:mr-4 file:py-2 file:px-4
                                file:rounded-lg file:border-0
                                file:text-sm file:font-semibold
                                file:bg-stone-200 dark:file:bg-stone-700 file:text-stone-700 dark:file:text-stone-200
                                hover:file:bg-stone-300 dark:hover:file:bg-stone-600 transition-colors cursor-pointer"
                            />
                            {videoFile && <p className="text-xs text-stone-500 dark:text-stone-400 mt-2">Archivo seleccionado: {videoFile.name}</p>}
                            {!videoFile && garment && <p className="text-xs text-stone-500 dark:text-stone-400 mt-2">Sube un nuevo video para reemplazar el actual.</p>}
                        </div>
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-stone-300 dark:border-stone-600"></div>
                            </div>
                            <div className="relative flex justify-center text-xs">
                                <span className="px-2 bg-stone-50 dark:bg-stone-800 text-stone-500 dark:text-stone-400">O</span>
                            </div>
                        </div>
                        <div>
                            <label htmlFor="videoUrl" className="block text-xs text-stone-500 dark:text-stone-400 mb-1">URL de video (YouTube, Vimeo, etc.)</label>
                            <input 
                                type="url" 
                                name="videoUrl" 
                                id="videoUrl" 
                                value={formData.videoUrl} 
                                onChange={handleVideoUrlChange}
                                placeholder="https://youtube.com/watch?v=..."
                                className="w-full p-2 border border-stone-300 dark:border-stone-600 rounded-md focus:ring-stone-500 dark:focus:ring-stone-400 focus:border-stone-500 dark:focus:border-stone-500 bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 text-sm"
                            />
                            <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">Si el upload de archivo falla, puedes usar una URL externa</p>
                        </div>
                    </div>
                    
                    {previewUrl && (
                        <div className="mt-4">
                            <video 
                                ref={videoPreviewRef} 
                                key={previewUrl} 
                                src={previewUrl} 
                                controls
                                playsInline 
                                crossOrigin="anonymous" 
                                className="w-full rounded-lg bg-black"
                                style={{maxHeight: '300px'}}
                            />
                        </div>
                    )}
                </div>
                <div>
                    <button 
                        type="button" 
                        onClick={handleAiAutocomplete}
                        disabled={isAiDisabled}
                        title={isAiDisabled && !isAiLoading ? "Sube un video para activar la IA." : "Autocompletar datos con IA"}
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
                    <label htmlFor="description" className="block text-sm font-medium text-stone-600 dark:text-stone-300 mb-1">Descripción</label>
                    <textarea name="description" id="description" value={formData.description} onChange={handleChange} required rows={3} className="w-full p-2 border border-stone-300 dark:border-stone-600 rounded-md focus:ring-stone-500 dark:focus:ring-stone-400 focus:border-stone-500 dark:focus:border-stone-500 bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                      <label htmlFor="material" className="block text-sm font-medium text-stone-600 dark:text-stone-300 mb-1">Materiales</label>
                      <input type="text" name="material" id="material" value={formData.material} onChange={handleChange} placeholder="Ej: Seda, Lino" className="w-full p-2 border border-stone-300 dark:border-stone-600 rounded-md focus:ring-stone-500 dark:focus:ring-stone-400 focus:border-stone-500 dark:focus:border-stone-500 bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100" />
                  </div>
                  <div>
                      <label htmlFor="occasion" className="block text-sm font-medium text-stone-600 dark:text-stone-300 mb-1">Ocasión Ideal</label>
                      <input type="text" name="occasion" id="occasion" value={formData.occasion} onChange={handleChange} placeholder="Ej: Boda de día, Gala" className="w-full p-2 border border-stone-300 dark:border-stone-600 rounded-md focus:ring-stone-500 dark:focus:ring-stone-400 focus:border-stone-500 dark:focus:border-stone-500 bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100" />
                  </div>
                </div>
                <div>
                    <label htmlFor="style_notes" className="block text-sm font-medium text-stone-600 dark:text-stone-300 mb-1">Notas de Estilo</label>
                    <input type="text" name="style_notes" id="style_notes" value={formData.style_notes} onChange={handleChange} placeholder="Ej: Corte sirena, Espalda descubierta" className="w-full p-2 border border-stone-300 dark:border-stone-600 rounded-md focus:ring-stone-500 dark:focus:ring-stone-400 focus:border-stone-500 dark:focus:border-stone-500 bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100" />
                </div>
                <div className="flex justify-end gap-4 pt-4">
                    <button type="button" onClick={onClose} className="bg-white dark:bg-stone-700 text-stone-700 dark:text-stone-200 font-medium py-2 px-4 rounded-lg border border-stone-300 dark:border-stone-600 hover:bg-stone-100 dark:hover:bg-stone-600 transition-colors">Cancelar</button>
                    <button type="submit" disabled={isProductLoading} className="bg-stone-800 dark:bg-stone-700 text-white font-medium py-2 px-6 rounded-lg hover:bg-stone-700 dark:hover:bg-stone-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                      {isProductLoading ? (
                        <>
                          <SpinnerIcon className="w-4 h-4 animate-spin" />
                          Guardando...
                        </>
                      ) : (
                        'Guardar'
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
          <CloseIcon className="w-8 h-8"/>
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

export default AdminFormModal;