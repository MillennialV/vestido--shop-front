import React, { useState, useRef } from 'react';
import type { Garment } from '../types';
import { uploadVideoFile, saveBulkGarments } from '../lib/db';
import { iaService } from '../services/iaService';
import { getFriendlySupabaseError } from '../lib/errorUtils';
import { CloseIcon, UploadIcon, SpinnerIcon, CheckCircleIcon, ExclamationTriangleIcon, SparklesIcon } from './Icons';

interface BulkUploadModalProps {
  onClose: () => void;
  onBulkSaveComplete: (newGarments: Garment[]) => void;
}

type UploadStatus = 'pending' | 'uploading' | 'processing' | 'completed' | 'error';

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
  };
  videoUrl?: string;
  videoRef: React.RefObject<HTMLVideoElement>;
}

const BulkUploadModal: React.FC<BulkUploadModalProps> = ({ onClose, onBulkSaveComplete }) => {
  const [files, setFiles] = useState<UploadableFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (selectedFiles: FileList | null) => {
    if (!selectedFiles) return;
    const newFiles: UploadableFile[] = Array.from(selectedFiles)
      .filter(file => file.type.startsWith('video/'))
      .map(file => ({
        id: crypto.randomUUID(),
        file,
        previewUrl: URL.createObjectURL(file),
        status: 'pending',
        progress: 0,
        garmentData: { title: file.name.replace(/\.[^/.]+$/, ""), brand: '', description: '', size: 'M', color: '', price: '', material: '', occasion: '', style_notes: '' },
        videoRef: React.createRef<HTMLVideoElement>(),
      }));
    setFiles(prev => [...prev, ...newFiles]);
  };

  const handleRemoveFile = (id: string) => {
    const fileToRemove = files.find(f => f.id === id);
    if (fileToRemove) {
      URL.revokeObjectURL(fileToRemove.previewUrl);
    }
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const updateFileState = (id: string, updates: Partial<UploadableFile>) => {
    setFiles(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f));
  };

  const handleInputChange = (id: string, field: keyof UploadableFile['garmentData'], value: string) => {
    setFiles(prev => prev.map(f => {
      if (f.id === id) {
        return { ...f, garmentData: { ...f.garmentData, [field]: value } };
      }
      return f;
    }));
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

  const processQueue = async () => {
    setIsProcessing(true);
    for (const file of files) {
      if (file.status === 'pending') {
        try {
          // 1. Upload video
          updateFileState(file.id, { status: 'uploading' });
          const videoUrl = await uploadVideoFile(file.file, (progress) => {
            updateFileState(file.id, { progress });
          });
          updateFileState(file.id, { videoUrl, progress: 100 });

          // 2. Analyze with AI - DEBE EJECUTARSE POR CADA PRENDA
          updateFileState(file.id, { status: 'processing' });
          
          // Esperar a que el video esté disponible y cargado
          const videoElement = file.videoRef.current;
          if (!videoElement) {
            throw new Error("El elemento de video no está disponible.");
          }

          // Verificar que el video esté cargado antes de analizarlo
          if (videoElement.readyState < 2) {
            await new Promise((resolve, reject) => {
              videoElement.addEventListener('loadeddata', resolve, { once: true });
              videoElement.addEventListener('error', () => reject(new Error("Error al cargar los datos del video.")), { once: true });
              // Timeout de seguridad
              setTimeout(() => reject(new Error("Timeout esperando a que el video se cargue.")), 30000);
            });
          }

          // Capturar un frame del video
          const base64Image = await captureFrame(videoElement);
          
          // Llamar a la API del servicio de IA
          const result = await iaService.analyzeGarmentFromBase64(base64Image);
          
          // Actualizar los datos de la prenda con la información de IA
          setFiles(prev => prev.map(f => {
            if (f.id === file.id) {
              const updatedData = { ...f.garmentData };
              const newPrice = result.price;
              let priceString = updatedData.price; // Mantener el valor actual por defecto

              if (typeof newPrice === 'number' && !isNaN(newPrice) && newPrice > 0) {
                priceString = String(newPrice);
              }

              // Safely merge AI data, providing fallbacks for undefined values
              updatedData.title = result.title || updatedData.title;
              updatedData.brand = result.brand || updatedData.brand;
              updatedData.description = result.description || updatedData.description;
              updatedData.color = result.color || updatedData.color;
              updatedData.price = priceString;
              updatedData.material = result.material || updatedData.material;
              updatedData.occasion = result.occasion || updatedData.occasion;
              updatedData.style_notes = result.style_notes || updatedData.style_notes;
              return { ...f, garmentData: updatedData };
            }
            return f;
          }));
          
          updateFileState(file.id, { status: 'completed' });

        } catch (error: any) {
          console.error(`[BulkUpload] Error al procesar ${file.file.name}:`, error);
          let errorMessage = error instanceof Error ? error.message : String(error);
          
          // Mensajes de error más descriptivos
          if (errorMessage.includes('CORS') || errorMessage.includes('conexión') || errorMessage.includes('Failed to fetch')) {
            errorMessage = `Error de conexión: No se pudo conectar al servicio de IA. Verifica que el servicio esté disponible y que CORS esté configurado correctamente.`;
          } else if (errorMessage.includes('parsear') || errorMessage.includes('JSON')) {
            errorMessage = `Error al procesar respuesta: ${errorMessage}`;
          } else if (errorMessage.includes('clave de API') || errorMessage.includes('API key')) {
            errorMessage = `Error de autenticación: ${errorMessage}. Nota: El servicio de IA no requiere clave de API.`;
          } else if (errorMessage.includes('video')) {
            errorMessage = `Error al procesar el video: ${errorMessage}`;
          }
          
          console.error(`[BulkUpload] Mensaje de error final para ${file.file.name}:`, errorMessage);
          updateFileState(file.id, { status: 'error', errorMessage });
        }
      }
    }
    setIsProcessing(false);
  };
  
  const handleSaveAll = async () => {
      const completedFiles = files.filter(f => f.status === 'completed');
      if (completedFiles.length === 0) {
          console.log("No hay prendas completadas para guardar.");
          return;
      }
      
      setIsSaving(true);
      
      const garmentsToSave: Omit<Garment, 'id' | 'created_at' | 'slug'>[] = completedFiles.map(f => {
        const price = f.garmentData.price ? parseFloat(f.garmentData.price) : undefined;
        return {
            ...f.garmentData,
            price,
            videoUrl: f.videoUrl!,
        };
      });

      try {
        const savedGarments = await saveBulkGarments(garmentsToSave);
        onBulkSaveComplete(savedGarments);
      } catch (error: any) {
        console.error("Failed to save bulk garments:", error);
        const alertMessage = getFriendlySupabaseError(error);
        console.log(`Error al guardar las prendas:\n\nDetalles: ${alertMessage}`);
      } finally {
        setIsSaving(false);
      }
  };

  const completedCount = files.filter(f => f.status === 'completed').length;
  const pendingCount = files.filter(f => f.status === 'pending').length;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 animate-fade-in" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="bulk-upload-title">
      <div className="relative bg-stone-50 rounded-lg shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <header className="p-6 border-b border-stone-200 flex justify-between items-center">
          <h2 id="bulk-upload-title" className="text-2xl font-semibold text-stone-900">Carga Masiva de Videos</h2>
          <button onClick={onClose} className="text-stone-600 hover:text-stone-900" aria-label="Cerrar">
            <CloseIcon className="w-6 h-6"/>
          </button>
        </header>

        <main className="flex-grow p-6 overflow-y-auto space-y-6">
          {files.length === 0 ? (
            <div 
              className="border-2 border-dashed border-stone-300 rounded-lg h-full flex flex-col items-center justify-center text-center text-stone-500"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                handleFileSelect(e.dataTransfer.files);
              }}
            >
              <UploadIcon className="w-12 h-12 mb-4"/>
              <p className="font-semibold">Arrastra y suelta tus videos aquí</p>
              <p className="text-sm">o</p>
              <button onClick={() => fileInputRef.current?.click()} className="mt-2 text-sky-600 font-semibold hover:underline">Selecciona tus archivos</button>
            </div>
          ) : (
            <div className="space-y-4">
              {files.map(file => (
                <div key={file.id} className="bg-white p-4 rounded-lg shadow-sm border border-stone-200 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="w-full aspect-[9/16] bg-black rounded-md overflow-hidden relative">
                    <video ref={file.videoRef} src={file.previewUrl} muted playsInline className="w-full h-full object-cover" crossOrigin="anonymous"/>
                    <div className="absolute top-2 right-2">
                        <StatusIndicator status={file.status} />
                    </div>
                  </div>
                  <div className="md:col-span-2 space-y-3">
                    <input type="text" placeholder="Título" value={file.garmentData.title} onChange={e => handleInputChange(file.id, 'title', e.target.value)} className="w-full p-2 border border-stone-300 rounded-md text-sm text-stone-900 placeholder:text-stone-400" />
                    <div className="grid grid-cols-3 gap-3">
                        <input type="text" placeholder="Marca" value={file.garmentData.brand} onChange={e => handleInputChange(file.id, 'brand', e.target.value)} className="w-full p-2 border border-stone-300 rounded-md text-sm text-stone-900 placeholder:text-stone-400" />
                        <input type="text" placeholder="Talla" value={file.garmentData.size} onChange={e => handleInputChange(file.id, 'size', e.target.value)} className="w-full p-2 border border-stone-300 rounded-md text-sm text-stone-900 placeholder:text-stone-400" />
                        <input type="text" placeholder="Color" value={file.garmentData.color} onChange={e => handleInputChange(file.id, 'color', e.target.value)} className="w-full p-2 border border-stone-300 rounded-md text-sm text-stone-900 placeholder:text-stone-400" />
                    </div>
                     <div className="relative">
                        <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-stone-500 text-sm">S/</span>
                        <input type="number" placeholder="Precio" value={file.garmentData.price} onChange={e => handleInputChange(file.id, 'price', e.target.value)} className="w-full p-2 pl-8 border border-stone-300 rounded-md text-sm text-stone-900 placeholder:text-stone-400" />
                    </div>
                    <textarea placeholder="Descripción" value={file.garmentData.description} onChange={e => handleInputChange(file.id, 'description', e.target.value)} rows={3} className="w-full p-2 border border-stone-300 rounded-md text-sm text-stone-900 placeholder:text-stone-400" />
                    
                    <input type="text" placeholder="Materiales (ej: Seda, Lino)" value={file.garmentData.material} onChange={e => handleInputChange(file.id, 'material', e.target.value)} className="w-full p-2 border border-stone-300 rounded-md text-sm text-stone-900 placeholder:text-stone-400" />
                    <input type="text" placeholder="Ocasión (ej: Boda, Gala)" value={file.garmentData.occasion} onChange={e => handleInputChange(file.id, 'occasion', e.target.value)} className="w-full p-2 border border-stone-300 rounded-md text-sm text-stone-900 placeholder:text-stone-400" />
                    <input type="text" placeholder="Notas de Estilo (ej: Corte sirena)" value={file.garmentData.style_notes} onChange={e => handleInputChange(file.id, 'style_notes', e.target.value)} className="w-full p-2 border border-stone-300 rounded-md text-sm text-stone-900 placeholder:text-stone-400" />

                    {file.status === 'uploading' && <ProgressBar progress={file.progress} />}
                    {file.status === 'error' && <p className="text-xs text-red-600">Error: {file.errorMessage}</p>}
                    <div className="text-right">
                        <button onClick={() => handleRemoveFile(file.id)} className="text-xs text-red-500 hover:underline">Eliminar</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          <input ref={fileInputRef} type="file" multiple accept="video/*" onChange={(e) => handleFileSelect(e.target.files)} className="hidden" />
        </main>

        <footer className="p-4 border-t border-stone-200 bg-white/50 backdrop-blur-sm flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 sm:gap-0">
          <div className="w-full sm:w-auto">
            <button onClick={() => fileInputRef.current?.click()} className="w-full sm:w-auto bg-white text-stone-700 font-medium py-2 px-4 rounded-lg border border-stone-300 hover:bg-stone-100 transition-colors text-sm">+ Añadir más</button>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
            <button 
              onClick={processQueue}
              disabled={isProcessing || pendingCount === 0}
              className="w-full sm:w-auto bg-stone-800 text-white font-medium py-2 px-4 rounded-lg hover:bg-stone-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm inline-flex items-center justify-center gap-2"
            >
              {isProcessing ? <SpinnerIcon className="w-4 h-4 animate-spin"/> : <SparklesIcon className="w-4 h-4" />}
              {isProcessing ? 'Autocompletando...' : `Autocompletar (${pendingCount}) con IA`}
            </button>
            <button
                onClick={handleSaveAll}
                disabled={isSaving || completedCount === 0}
                className="w-full sm:w-auto bg-sky-600 text-white font-medium py-2 px-4 rounded-lg hover:bg-sky-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
                {isSaving ? 'Guardando...' : `Guardar Completados (${completedCount})`}
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
};

const StatusIndicator: React.FC<{status: UploadStatus}> = ({ status }) => {
    const statusMap = {
        pending: { text: "Pendiente", icon: null },
        uploading: { text: "Subiendo...", icon: <SpinnerIcon className="w-4 h-4 text-white animate-spin" /> },
        processing: { text: "Analizando...", icon: <SpinnerIcon className="w-4 h-4 text-white animate-spin" /> },
        completed: { text: "Completo", icon: <CheckCircleIcon className="w-5 h-5 text-green-400" /> },
        error: { text: "Error", icon: <ExclamationTriangleIcon className="w-5 h-5 text-red-400" /> },
    };
    const { icon } = statusMap[status];
    if (!icon) return null;
    return <div className="p-1.5 bg-black/50 rounded-full">{icon}</div>;
};

const ProgressBar: React.FC<{progress: number}> = ({ progress }) => (
    <div className="w-full bg-stone-200 rounded-full h-1.5">
        <div className="bg-sky-500 h-1.5 rounded-full" style={{ width: `${progress}%` }}></div>
    </div>
);

export default BulkUploadModal;